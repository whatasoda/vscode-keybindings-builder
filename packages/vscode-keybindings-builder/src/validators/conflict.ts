import type { ConflictInfo, RegisteredKey, VSCodeKeybinding } from "../types";
import { normalizeKey } from "../utils/normalize";

export const detectConflicts = (
  builderKeys: Map<string, RegisteredKey>,
  manualKeybindings: VSCodeKeybinding[],
): ConflictInfo[] => {
  const conflicts: ConflictInfo[] = [];

  for (const manual of manualKeybindings) {
    const normalizedManualKey = normalizeKey(manual.key);

    for (const [normalizedBuilderKey, registered] of builderKeys) {
      if (normalizedManualKey === normalizedBuilderKey) {
        // Check if commands are different (true conflict)
        const builderCommand = registered.commands[0]?.name || "";
        
        // Skip if it's the exact same command (not a conflict)
        if (manual.command === builderCommand) {
          continue;
        }
        
        // Skip if manual command is a disable command for a default we're clearing
        if (registered.mode === "clearDefault" && manual.command.startsWith("-")) {
          continue;
        }
        
        // This is a true conflict - same key, different commands
        conflicts.push({
          key: manual.key,
          manualCommand: manual.command,
          builderCommand,
        });
      }
    }
  }

  return conflicts;
};