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
        // Get builder command details
        const builderCommand = registered.commands[0]?.name || "";
        const builderWhen = registered.commands[0]?.when;
        
        // Skip if it's the exact same command and when condition (not a conflict)
        if (manual.command === builderCommand && manual.when === builderWhen) {
          continue;
        }
        
        // Skip if manual command is a disable command for a default we're clearing
        if (registered.mode === "clearDefault" && manual.command.startsWith("-")) {
          continue;
        }
        
        // If same command but different when conditions, they can coexist (not a conflict)
        if (manual.command === builderCommand && manual.when !== builderWhen) {
          // Different when conditions mean they operate in different contexts
          continue;
        }
        
        // This is a true conflict - same key, different commands or same command without compatible when conditions
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