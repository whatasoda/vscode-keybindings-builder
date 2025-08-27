import { err, ok, type Result } from "neverthrow";
import * as path from "path";
import type { KeybindingBuilder } from "./builder";
import type { BuilderError } from "./errors";
import { generateClearDefaultBindings } from "./generators/clearDefault";
import { generateOverrideDefaultBindings } from "./generators/overrideDefault";
import { generatePreserveDefaultBindings } from "./generators/preserveDefault";
import { parseJSON } from "./parser/json";
import { parseJSONCFile } from "./parser/jsonc";
import { VSCodeKeybindingsSchema } from "./schemas";
import type { BuildSuccess, RegisteredKey, VSCodeKeybinding } from "./types";
import { readFileAsync, writeFileAsync } from "./utils/file";
import { normalizeKey } from "./utils/normalize";
import { detectConflicts } from "./validators/conflict";

export async function buildKeybindings(
  builder: KeybindingBuilder,
): Promise<Result<BuildSuccess, BuilderError>> {
  const config = builder.getConfig();
  const registeredKeys = builder.getRegisteredKeys();

  // Load default keybindings
  const defaultKeybindingsPath = path.join(
    config.dirname,
    config.defaultKeybindingsFile || "default-keybindings.jsonc",
  );

  const defaultResult = await loadDefaultKeybindings(defaultKeybindingsPath);
  if (defaultResult.isErr()) {
    // If default keybindings not found, we can continue with empty defaults
    if (defaultResult.error.type === "FILE_NOT_FOUND") {
      console.warn(
        `Default keybindings file not found at ${defaultKeybindingsPath}, continuing with empty defaults`,
      );
    } else {
      return err(defaultResult.error);
    }
  }

  const defaultKeybindings = defaultResult.isOk() ? defaultResult.value : [];

  // Load current keybindings if provided
  let currentKeybindings: VSCodeKeybinding[] = [];
  if (config.currentKeybindingPath) {
    const currentResult = await loadCurrentKeybindings(config.currentKeybindingPath);
    if (currentResult.isErr()) {
      return err(currentResult.error);
    }
    currentKeybindings = currentResult.value;
  }

  // Check for conflicts (pure function)
  const conflicts = detectConflicts(registeredKeys, currentKeybindings);
  if (conflicts.length > 0) {
    return err({ type: "CONFLICT_DETECTED", conflicts } as const);
  }

  // Generate warnings for preserved keybindings
  const warnings = generatePreservationWarnings(registeredKeys, currentKeybindings);

  // Build final keybindings array (pure function)
  const keybindings = buildKeybindingsArray(registeredKeys, defaultKeybindings, currentKeybindings);

  // Write output file
  const outputPath = path.join(config.dirname, config.outputFile || "keybindings-generated.json");
  const writeResult = await writeFileAsync(outputPath, JSON.stringify(keybindings, null, 2));

  if (writeResult.isErr()) {
    return err(writeResult.error);
  }

  return ok({
    type: "BUILD_SUCCESS",
    keybindingsCount: registeredKeys.size,
    preservedCount: currentKeybindings.length - conflicts.length,
    outputPath,
    warnings,
  } as const);
}

async function loadDefaultKeybindings(
  filePath: string,
): Promise<Result<VSCodeKeybinding[], BuilderError>> {
  const contentResult = await readFileAsync(filePath);
  if (contentResult.isErr()) {
    return err(contentResult.error);
  }

  const parseResult = parseJSONCFile(contentResult.value, filePath);
  if (parseResult.isErr()) {
    return err(parseResult.error);
  }

  const validation = VSCodeKeybindingsSchema.safeParse(parseResult.value);
  if (!validation.success) {
    return err({
      type: "VALIDATION_ERROR",
      details: validation.error,
    } as const);
  }

  return ok(validation.data);
}

async function loadCurrentKeybindings(
  filePath: string,
): Promise<Result<VSCodeKeybinding[], BuilderError>> {
  const contentResult = await readFileAsync(filePath);
  if (contentResult.isErr()) {
    return err(contentResult.error);
  }

  const parseResult = parseJSON(contentResult.value, filePath);
  if (parseResult.isErr()) {
    return err(parseResult.error);
  }

  const validation = VSCodeKeybindingsSchema.safeParse(parseResult.value);
  if (!validation.success) {
    return err({
      type: "VALIDATION_ERROR",
      details: validation.error,
    } as const);
  }

  return ok(validation.data);
}

function generatePreservationWarnings(
  registeredKeys: Map<string, RegisteredKey>,
  currentKeybindings: VSCodeKeybinding[],
): string[] {
  const warnings: string[] = [];
  const builderKeys = new Set(Array.from(registeredKeys.keys()));

  for (const kb of currentKeybindings) {
    const normalizedKey = normalizeKey(kb.key);
    if (!builderKeys.has(normalizedKey)) {
      warnings.push(`Preserving manual keybinding: ${kb.key} -> ${kb.command}`);
    }
  }

  return warnings;
}

function buildKeybindingsArray(
  registeredKeys: Map<string, RegisteredKey>,
  defaultKeybindings: VSCodeKeybinding[],
  manualKeybindings: VSCodeKeybinding[],
): VSCodeKeybinding[] {
  const result: VSCodeKeybinding[] = [];

  // Process each registered key based on mode
  for (const [_, registered] of registeredKeys) {
    const defaultCommands = defaultKeybindings
      .filter((kb) => normalizeKey(kb.key) === normalizeKey(registered.key))
      .map((kb) => kb.command);

    switch (registered.mode) {
      case "clearDefault":
        result.push(
          ...generateClearDefaultBindings(registered.key, defaultCommands, registered.commands),
        );
        break;
      case "preserveDefault":
        result.push(...generatePreserveDefaultBindings(registered.key, registered.commands));
        break;
      case "overrideDefault":
        result.push(
          ...generateOverrideDefaultBindings(registered.key, defaultCommands, registered.commands),
        );
        break;
    }
  }

  // Add preserved manual keybindings
  const builderKeys = new Set(Array.from(registeredKeys.values()).map((r) => normalizeKey(r.key)));

  const preserved = manualKeybindings.filter((kb) => !builderKeys.has(normalizeKey(kb.key)));

  return [...result, ...preserved];
}
