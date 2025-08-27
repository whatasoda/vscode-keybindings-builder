import { describe, it, expect } from "bun:test";
import { generateOverrideDefaultBindings } from "./overrideDefault";

describe("generateOverrideDefaultBindings", () => {
  it("should generate disable commands for defaults and add custom commands", () => {
    const result = generateOverrideDefaultBindings(
      "ctrl+p",
      ["workbench.action.quickOpen"],
      [{ name: "myCommand", when: "editorFocus" }]
    );

    expect(result).toEqual([
      { key: "ctrl+p", command: "-workbench.action.quickOpen" },
      { key: "ctrl+p", command: "myCommand", when: "editorFocus", args: undefined },
    ]);
  });

  it("should handle keys with no default bindings", () => {
    const result = generateOverrideDefaultBindings(
      "ctrl+alt+x",
      [],
      [{ name: "customCommand" }]
    );

    expect(result.length).toBe(1);
    expect(result[0].command).toBe("customCommand");
  });

  it("should handle multiple defaults and custom commands", () => {
    const result = generateOverrideDefaultBindings(
      "ctrl+k",
      ["default1", "default2"],
      [{ name: "custom1" }, { name: "custom2" }]
    );

    expect(result.length).toBe(4);
    expect(result[0].command).toBe("-default1");
    expect(result[1].command).toBe("-default2");
    expect(result[2].command).toBe("custom1");
    expect(result[3].command).toBe("custom2");
  });

  it("should preserve args and when conditions", () => {
    const result = generateOverrideDefaultBindings(
      "ctrl+h",
      ["editor.action.startFindReplaceAction"],
      [
        { 
          name: "customFindReplace", 
          when: "editorTextFocus && !editorReadonly",
          args: { query: "test", isRegex: true }
        }
      ]
    );

    expect(result.length).toBe(2);
    expect(result[0].command).toBe("-editor.action.startFindReplaceAction");
    expect(result[1].when).toBe("editorTextFocus && !editorReadonly");
    expect(result[1].args).toEqual({ query: "test", isRegex: true });
  });
});