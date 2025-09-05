import { err, ok, type Result } from "neverthrow";
import { buildKeybindings } from "./build";
import type { BuilderError } from "./errors";
import type {
  BuilderConfig,
  BuildSuccess,
  Command,
  KeyHandlingMode,
  RegisteredKey,
} from "./types";
import { normalizeKey } from "./utils/normalize";
import { validateKeyFormat } from "./validators/key";

export interface KeybindingBuilderHost {
  key(combination: string, mode: KeyHandlingMode): KeybindingBuilder;
  build(): Promise<Result<BuildSuccess, BuilderError>>;
  getRegisteredKeys(): Map<string, RegisteredKey>;
  getConfig(): BuilderConfig;
}

export interface KeybindingBuilder {
  command(
    name: string,
    options?: { when?: string; args?: unknown }
  ): KeybindingBuilder;
  register(): Result<null, BuilderError>;
}

// Pure function for validation
const validateAndNormalizeKey = (key: string): Result<string, BuilderError> => {
  const validation = validateKeyFormat(key);
  if (validation.isErr()) {
    return err(validation.error);
  }
  return ok(normalizeKey(key));
};

export function createKeybindingsBuilderForKey(
  key: string,
  mode: KeyHandlingMode,
  registeredKeys: Map<string, RegisteredKey>
): KeybindingBuilder {
  const currentCommands: Command[] = [];

  const builder: KeybindingBuilder = {
    command(
      name: string,
      options?: { when?: string; args?: unknown }
    ): KeybindingBuilder {
      currentCommands.push({ name, ...options });
      return builder;
    },
    register(): Result<null, BuilderError> {
      const normalized = validateAndNormalizeKey(key);
      if (normalized.isErr()) {
        return err(normalized.error);
      }

      if (registeredKeys.has(normalized.value)) {
        return err({
          type: "DUPLICATE_KEY",
          key,
          existingIndex: Array.from(registeredKeys.keys()).indexOf(
            normalized.value
          ),
        } as const);
      }

      registeredKeys.set(normalized.value, {
        key,
        mode,
        commands: [...currentCommands],
      });

      return ok(null);
    },
  };

  return builder;
}

export function createKeybindingsBuilder(
  config: BuilderConfig
): KeybindingBuilderHost {
  const registeredKeys = new Map<string, RegisteredKey>();

  // Builder API with fluent interface
  const builder: KeybindingBuilderHost = {
    key(combination: string, mode: KeyHandlingMode): KeybindingBuilder {
      return createKeybindingsBuilderForKey(combination, mode, registeredKeys);
    },

    async build(): Promise<Result<BuildSuccess, BuilderError>> {
      return buildKeybindings(builder);
    },

    getRegisteredKeys: () => new Map(registeredKeys),
    getConfig: () => ({ ...config }),
  };

  return builder;
}
