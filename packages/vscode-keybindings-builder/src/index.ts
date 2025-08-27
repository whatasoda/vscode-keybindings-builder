import { err, ok, type Result } from "neverthrow";
import { createKeybindingsBuilder, type KeybindingBuilder } from "./builder";
import type { BuilderError } from "./errors";
import { BuilderConfigSchema } from "./schemas";
import type { BuilderConfig } from "./types";

export function createBuilder(config: unknown): Result<KeybindingBuilder, BuilderError> {
  const validation = BuilderConfigSchema.safeParse(config);

  if (!validation.success) {
    return err({
      type: "CONFIG_INVALID",
      errors: validation.error,
    } as const);
  }

  const validatedConfig: BuilderConfig = validation.data;
  return ok(createKeybindingsBuilder(validatedConfig));
}

// Export types for consumers
export type { KeybindingBuilder } from "./builder";
export type { BuilderError } from "./errors";
export type {
  BuilderConfig,
  BuildSuccess,
  Command,
  ConflictInfo,
  KeyHandlingMode,
  RegisteredKey,
  VSCodeKeybinding,
} from "./types";
