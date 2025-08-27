import { describe, it, expect } from "bun:test";
import { generateClearDefaultBindings } from "./clearDefault";

describe("generateClearDefaultBindings", () => {
  it("should generate disable commands followed by custom commands", () => {
    const result = generateClearDefaultBindings(
      "cmd+p",
      ["workbench.action.quickOpen"],
      [{ name: "myCommand", when: "editorFocus" }]
    );

    expect(result).toEqual([
      { key: "cmd+p", command: "-workbench.action.quickOpen" },
      { key: "cmd+p", command: "myCommand", when: "editorFocus", args: undefined },
    ]);
  });

  it("should handle multiple default commands", () => {
    const result = generateClearDefaultBindings(
      "ctrl+k",
      ["command1", "command2", "command3"],
      [{ name: "customCommand" }]
    );

    expect(result.length).toBe(4);
    expect(result[0].command).toBe("-command1");
    expect(result[1].command).toBe("-command2");
    expect(result[2].command).toBe("-command3");
    expect(result[3].command).toBe("customCommand");
  });

  it("should handle multiple custom commands", () => {
    const result = generateClearDefaultBindings(
      "ctrl+s",
      ["workbench.action.files.save"],
      [
        { name: "custom1", when: "condition1" },
        { name: "custom2", when: "condition2" },
        { name: "custom3" },
      ]
    );

    expect(result.length).toBe(4);
    expect(result[0].command).toBe("-workbench.action.files.save");
    expect(result[1]).toEqual({ 
      key: "ctrl+s", 
      command: "custom1", 
      when: "condition1",
      args: undefined,
    });
    expect(result[2].when).toBe("condition2");
    expect(result[3].when).toBe(undefined);
  });

  it("should handle empty default commands", () => {
    const result = generateClearDefaultBindings(
      "ctrl+t",
      [],
      [{ name: "myCommand" }]
    );

    expect(result.length).toBe(1);
    expect(result[0].command).toBe("myCommand");
  });

  it("should handle empty custom commands", () => {
    const result = generateClearDefaultBindings(
      "ctrl+u",
      ["defaultCommand"],
      []
    );

    expect(result.length).toBe(1);
    expect(result[0].command).toBe("-defaultCommand");
  });

  it("should preserve args in custom commands", () => {
    const result = generateClearDefaultBindings(
      "ctrl+h",
      [],
      [{ name: "findReplace", args: { find: "hello", replace: "world" } }]
    );

    expect(result[0].args).toEqual({ find: "hello", replace: "world" });
  });
});