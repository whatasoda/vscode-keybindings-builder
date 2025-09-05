import { describe, expect, it } from "bun:test";
import type { RegisteredKey, VSCodeKeybinding } from "../types";
import { detectConflicts } from "./conflict";

describe("detectConflicts", () => {
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

    const conflicts2 = detectConflicts(
      emptyBuilderKeys,
      [{ key: "ctrl+a", command: "test" }],
    );
    expect(conflicts2.length).toBe(0);
  });

  it("should detect conflict when multiple commands are registered", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "ctrl+p",
        {
          key: "ctrl+p",
          mode: "preserveDefault",
          commands: [
            { name: "command1" },
            { name: "command2", when: "condition" },
          ],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [{ key: "ctrl+p", command: "manualCommand" }];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]?.builderCommand).toBe("command1"); // Should use first command
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
});