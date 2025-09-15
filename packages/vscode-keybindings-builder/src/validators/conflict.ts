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
        // Check against ALL commands registered for this key
        let foundMatch = false;

        for (const builderCmd of registered.commands) {
          const builderCommand = builderCmd.name;
          const builderWhen = builderCmd.when;

          // Skip if it's the exact same command and when condition (not a conflict)
          if (manual.command === builderCommand && manual.when === builderWhen) {
            foundMatch = true;
            break;
          }

          // If same command but different when conditions, they can coexist (not a conflict)
          if (manual.command === builderCommand && manual.when !== builderWhen) {
            foundMatch = true;
            break;
          }
        }

        // Skip if manual command is a disable command for a default we're clearing
        if (registered.mode === "clearDefault" && manual.command.startsWith("-")) {
          continue;
        }

        // If we found a match (same command, same or different when), it's not a conflict
        if (foundMatch) {
          continue;
        }

        // This is a true conflict - same key, different commands
        // Include when conditions in the conflict info for better clarity
        const builderCommandsWithWhen = registered.commands
          .map((c) => (c.when ? `${c.name} (when: ${c.when})` : c.name))
          .join(", ");

        const manualCommandWithWhen = manual.when
          ? `${manual.command} (when: ${manual.when})`
          : manual.command;

        conflicts.push({
          key: manual.key,
          manualCommand: manualCommandWithWhen,
          builderCommand: builderCommandsWithWhen,
        });
      }
    }
  }

  return conflicts;
};
