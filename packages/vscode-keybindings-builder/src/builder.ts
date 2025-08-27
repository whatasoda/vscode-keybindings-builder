import { Result, ok, err } from "neverthrow";
import type {
  BuilderConfig,
  Command,
  KeyHandlingMode,
  RegisteredKey,
  BuildSuccess,
} from "./types";
import type { BuilderError } from "./errors";
import { normalizeKey } from "./utils/normalize";
import { validateKeyFormat } from "./validators/key";
import { buildKeybindings } from "./build";

export interface KeybindingBuilder {
  key(combination: string, mode: KeyHandlingMode): Result<KeybindingBuilder, BuilderError>;
  command(name: string, options?: { when?: string; args?: unknown }): Result<KeybindingBuilder, BuilderError>;
  register(): Result<KeybindingBuilder, BuilderError>;
  build(): Promise<Result<BuildSuccess, BuilderError>>;
  getRegisteredKeys(): Map<string, RegisteredKey>;
  getConfig(): BuilderConfig;
}

export function createKeybindingsBuilder(config: BuilderConfig): KeybindingBuilder {
  // Private state encapsulated in closure
  let currentKey: string | null = null;
  let currentMode: KeyHandlingMode | null = null;
  let currentCommands: Command[] = [];
  const registeredKeys = new Map<string, RegisteredKey>();

  // Pure function for validation
  const validateAndNormalizeKey = (key: string): Result<string, BuilderError> => {
    const validation = validateKeyFormat(key);
    if (validation.isErr()) {
      return err(validation.error);
    }
    return ok(normalizeKey(key));
  };

  // Builder API with fluent interface
  const builder: KeybindingBuilder = {
    key(combination: string, mode: KeyHandlingMode): Result<KeybindingBuilder, BuilderError> {
      const normalized = validateAndNormalizeKey(combination);
      if (normalized.isErr()) {
        return err(normalized.error);
      }

      currentKey = combination;
      currentMode = mode;
      currentCommands = [];
      return ok(builder);
    },

    command(name: string, options?: { when?: string; args?: unknown }): Result<KeybindingBuilder, BuilderError> {
      if (!currentKey) {
        return err({ type: "NO_KEY_ACTIVE", operation: "command" } as const);
      }

      currentCommands.push({ name, ...options });
      return ok(builder);
    },

    register(): Result<KeybindingBuilder, BuilderError> {
      if (!currentKey || !currentMode) {
        return err({ type: "NO_KEY_ACTIVE", operation: "register" } as const);
      }

      const normalized = normalizeKey(currentKey);
      if (registeredKeys.has(normalized)) {
        return err({
          type: "DUPLICATE_KEY",
          key: currentKey,
          existingIndex: Array.from(registeredKeys.keys()).indexOf(normalized),
        } as const);
      }

      registeredKeys.set(normalized, {
        key: currentKey,
        mode: currentMode,
        commands: [...currentCommands],
      });

      // Clear current state
      currentKey = null;
      currentMode = null;
      currentCommands = [];
      return ok(builder);
    },

    async build(): Promise<Result<BuildSuccess, BuilderError>> {
      return buildKeybindings(builder);
    },

    getRegisteredKeys: () => new Map(registeredKeys),
    getConfig: () => ({ ...config }),
  };

  return builder;
}