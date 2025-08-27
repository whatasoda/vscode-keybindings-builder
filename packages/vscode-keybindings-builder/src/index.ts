import { Result, ok, err } from "neverthrow";
import { BuilderConfigSchema } from "./schemas";
import { createKeybindingsBuilder, type KeybindingBuilder } from "./builder";
import type { BuilderConfig } from "./types";
import type { BuilderError } from "./errors";

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
export type { 
  BuilderConfig,
  KeyHandlingMode,
  Command,
  RegisteredKey,
  VSCodeKeybinding,
  BuildSuccess,
  ConflictInfo,
} from "./types";

export type { BuilderError } from "./errors";