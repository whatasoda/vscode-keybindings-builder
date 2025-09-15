import { describe, expect, it } from "bun:test";
import type { RegisteredKey, VSCodeKeybinding } from "../types";
import { detectConflicts } from "./conflict";

describe("detectConflicts", () => {
  it("should not conflict when same command has different when conditions", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "a+ctrl", // Normalized form of ctrl+a
        {
          key: "ctrl+a",
          mode: "clearDefault",
          commands: [{ name: "selectAll", when: "editorTextFocus" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+a", command: "selectAll", when: "terminalFocus" }, // Same command, different when
      { key: "ctrl+a", command: "selectAll", when: "editorTextFocus" }, // Same command, same when
      { key: "ctrl+a", command: "selectAll" }, // Same command, no when condition
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    // Should have no conflicts because different when conditions allow coexistence
    expect(conflicts.length).toBe(0);
  });

  it("should conflict when different commands regardless of when conditions", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "a+ctrl",
        {
          key: "ctrl+a",
          mode: "clearDefault",
          commands: [{ name: "selectAll", when: "editorTextFocus" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+a", command: "differentCommand", when: "editorTextFocus" }, // Different command, same when
      { key: "ctrl+a", command: "differentCommand", when: "terminalFocus" }, // Different command, different when
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    // Should have conflicts because commands are different
    expect(conflicts.length).toBe(2);
  });

  it("should handle undefined when conditions correctly", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "a+ctrl",
        {
          key: "ctrl+a",
          mode: "clearDefault",
          commands: [{ name: "selectAll" }], // No when condition
        },
      ],
      [
        "b+ctrl",
        {
          key: "ctrl+b",
          mode: "clearDefault",
          commands: [{ name: "boldText", when: "editorTextFocus" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+a", command: "selectAll" }, // Same command, both undefined when
      { key: "ctrl+a", command: "selectAll", when: "editorTextFocus" }, // Same command, different when
      { key: "ctrl+b", command: "boldText" }, // Same command, builder has when, manual doesn't
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    // No conflicts - same commands with different or compatible when conditions
    expect(conflicts.length).toBe(0);
  });

  it("should detect conflicts when same key has different commands", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "ctrl+p",
        {
          key: "ctrl+p",
          mode: "clearDefault",
          commands: [{ name: "myCommand" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+p", command: "workbench.action.quickOpen" },
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]).toEqual({
      key: "ctrl+p",
      manualCommand: "workbench.action.quickOpen",
      builderCommand: "myCommand",
    });
  });

  it("should NOT detect conflict when same key has same command", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "ctrl+p",
        {
          key: "ctrl+p",
          mode: "clearDefault",
          commands: [{ name: "workbench.action.quickOpen" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+p", command: "workbench.action.quickOpen" },
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(0);
  });

  it("should NOT detect conflict for disable commands in clearDefault mode", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "ctrl+p",
        {
          key: "ctrl+p",
          mode: "clearDefault",
          commands: [{ name: "myCommand" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+p", command: "-workbench.action.quickOpen" },
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(0);
  });

  it("should return list of conflicting keys with different commands", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "a+ctrl", // Normalized form of ctrl+a
        {
          key: "ctrl+a",
          mode: "clearDefault",
          commands: [{ name: "selectAll" }],
        },
      ],
      [
        "b+ctrl", // Normalized form of ctrl+b
        {
          key: "ctrl+b",
          mode: "preserveDefault",
          commands: [{ name: "boldText" }],
        },
      ],
      [
        "c+ctrl", // Normalized form of ctrl+c
        {
          key: "ctrl+c",
          mode: "preserveDefault",
          commands: [{ name: "editor.action.copy" }], // Same as manual
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+a", command: "editor.action.selectAll" }, // Different
      { key: "ctrl+b", command: "editor.action.bold" }, // Different
      { key: "ctrl+c", command: "editor.action.copy" }, // Same - not a conflict
      { key: "ctrl+d", command: "editor.action.duplicate" }, // Not in builder - ignored
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(2);
    expect(conflicts[0]?.key).toBe("ctrl+a");
    expect(conflicts[1]?.key).toBe("ctrl+b");
  });

  it("should ignore non-conflicting manual keybindings", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "ctrl+p",
        {
          key: "ctrl+p",
          mode: "clearDefault",
          commands: [{ name: "myCommand" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+s", command: "workbench.action.files.save" },
      { key: "ctrl+shift+s", command: "workbench.action.files.saveAs" },
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(0);
  });

  it("should handle case-insensitive key comparisons", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "ctrl+p+shift",
        {
          // normalized form
          key: "Ctrl+Shift+P",
          mode: "clearDefault",
          commands: [{ name: "myCommand" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "shift+ctrl+p", command: "workbench.action.showCommands" },
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]?.manualCommand).toBe("workbench.action.showCommands");
  });

  it("should handle empty inputs", () => {
    const emptyBuilderKeys = new Map<string, RegisteredKey>();
    const emptyManualKeybindings: VSCodeKeybinding[] = [];

    const conflicts = detectConflicts(emptyBuilderKeys, emptyManualKeybindings);
    expect(conflicts.length).toBe(0);

    const conflicts2 = detectConflicts(emptyBuilderKeys, [{ key: "ctrl+a", command: "test" }]);
    expect(conflicts2.length).toBe(0);
  });

  it("should detect conflict when multiple commands are registered", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "ctrl+p",
        {
          key: "ctrl+p",
          mode: "preserveDefault",
          commands: [{ name: "command1" }, { name: "command2", when: "condition" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [{ key: "ctrl+p", command: "manualCommand" }];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]?.builderCommand).toBe("command1, command2 (when: condition)"); // Should show all commands with when conditions
  });

  it("should not detect conflict for same command with different when conditions", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "ctrl+p",
        {
          key: "ctrl+p",
          mode: "preserveDefault",
          commands: [{ name: "command1", when: "editorFocus" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+p", command: "command1", when: "terminalFocus" },
    ];

    // Same command, different when conditions - still not a conflict
    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(0);
  });

  it("should handle multiple commands with same key correctly", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "ctrl+l+shift", // normalized form of ctrl+shift+l
        {
          key: "ctrl+shift+l",
          mode: "clearDefault",
          commands: [
            { name: "editor.action.rename", when: "editorTextFocus" },
            { name: "renameFile", when: "filesExplorerFocus" },
          ],
        },
      ],
    ]);

    // Test with manual keybindings that match one of the commands
    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+shift+l", command: "editor.action.rename", when: "editorTextFocus" }, // Matches first
      { key: "ctrl+shift+l", command: "renameFile", when: "filesExplorerFocus" }, // Matches second
      { key: "ctrl+shift+l", command: "differentCommand", when: "terminalFocus" }, // Different command
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(1); // Only the differentCommand should conflict
    expect(conflicts[0]?.manualCommand).toBe("differentCommand (when: terminalFocus)");
  });
});
