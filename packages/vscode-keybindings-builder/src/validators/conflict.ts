import type { RegisteredKey, VSCodeKeybinding, ConflictInfo } from "../types";
import { normalizeKey } from "../utils/normalize";

export const detectConflicts = (
  builderKeys: Map<string, RegisteredKey>,
  manualKeybindings: VSCodeKeybinding[]
): ConflictInfo[] => {
  const conflicts: ConflictInfo[] = [];

  for (const manual of manualKeybindings) {
    const normalizedManualKey = normalizeKey(manual.key);

    for (const [normalizedBuilderKey, registered] of builderKeys) {
      if (normalizedManualKey === normalizedBuilderKey) {
        conflicts.push({
          key: manual.key,
          manualCommand: manual.command,
          builderCommand: registered.commands[0]?.name || "",
        });
      }
    }
  }

  return conflicts;
};