import { describe, expect, it } from "bun:test";
import type { RegisteredKey, VSCodeKeybinding } from "../types";
import { detectConflicts } from "./conflict";

describe("detectConflicts", () => {
  it("should detect conflicts between builder and manual keybindings", () => {
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

  it("should return list of conflicting keys", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "a+ctrl",
        {
          // normalized form (alphabetical)
          key: "ctrl+a",
          mode: "clearDefault",
          commands: [{ name: "selectAll" }],
        },
      ],
      [
        "b+ctrl",
        {
          // normalized form (alphabetical)
          key: "ctrl+b",
          mode: "preserveDefault",
          commands: [{ name: "boldText" }],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [
      { key: "ctrl+a", command: "editor.action.selectAll" },
      { key: "ctrl+b", command: "editor.action.bold" },
      { key: "ctrl+c", command: "editor.action.copy" },
    ];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(2);
    expect(conflicts[0]!.key).toBe("ctrl+a");
    expect(conflicts[1]!.key).toBe("ctrl+b");
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
    expect(conflicts[0]!.manualCommand).toBe("workbench.action.showCommands");
  });

  it("should handle empty inputs", () => {
    const emptyBuilderKeys = new Map<string, RegisteredKey>();
    const emptyManualKeybindings: VSCodeKeybinding[] = [];

    const conflicts1 = detectConflicts(emptyBuilderKeys, [{ key: "ctrl+p", command: "test" }]);
    expect(conflicts1.length).toBe(0);

    const conflicts2 = detectConflicts(
      new Map([["ctrl+p", { key: "ctrl+p", mode: "clearDefault", commands: [] }]]),
      emptyManualKeybindings,
    );
    expect(conflicts2.length).toBe(0);

    const conflicts3 = detectConflicts(emptyBuilderKeys, emptyManualKeybindings);
    expect(conflicts3.length).toBe(0);
  });

  it("should handle multiple commands for same key", () => {
    const builderKeys = new Map<string, RegisteredKey>([
      [
        "ctrl+p",
        {
          key: "ctrl+p",
          mode: "clearDefault",
          commands: [
            { name: "command1", when: "condition1" },
            { name: "command2", when: "condition2" },
          ],
        },
      ],
    ]);

    const manualKeybindings: VSCodeKeybinding[] = [{ key: "ctrl+p", command: "manualCommand" }];

    const conflicts = detectConflicts(builderKeys, manualKeybindings);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]!.builderCommand).toBe("command1"); // Should use first command
  });
});
