import type z from "zod";
import { createKeybindingsBuilder, type KeybindingBuilderHost } from "./builder";
import { BuilderConfigSchema } from "./schemas";
import type { BuilderConfig } from "./types";

export function createBuilder(config: z.input<typeof BuilderConfigSchema>): KeybindingBuilderHost {
  const validation = BuilderConfigSchema.safeParse(config);

  if (!validation.success) {
    // biome-ignore lint/suspicious/noConsole: make process fail
    console.error(validation.error);
    process.exit(1);
  }

  const validatedConfig: BuilderConfig = validation.data;
  return createKeybindingsBuilder(validatedConfig);
}

// Export types for consumers
export type { KeybindingBuilderHost as KeybindingBuilder } from "./builder";
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
