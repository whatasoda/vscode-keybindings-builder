import { describe, expect, it } from "bun:test";
import { generatePreserveDefaultBindings } from "./preserveDefault";

describe("generatePreserveDefaultBindings", () => {
  it("should only generate custom commands without disabling defaults", () => {
    const result = generatePreserveDefaultBindings("ctrl+p", [
      { name: "myCommand", when: "editorFocus" },
    ]);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      key: "ctrl+p",
      command: "myCommand",
      when: "editorFocus",
      args: undefined,
    });
  });

  it("should handle multiple custom commands", () => {
    const result = generatePreserveDefaultBindings("ctrl+k", [
      { name: "command1", when: "condition1" },
      { name: "command2", when: "condition2" },
      { name: "command3" },
    ]);

    expect(result.length).toBe(3);
    expect(result[0]!.command).toBe("command1");
    expect(result[1]!.command).toBe("command2");
    expect(result[2]!.command).toBe("command3");
    expect(result[0]!.when).toBe("condition1");
    expect(result[1]!.when).toBe("condition2");
    expect(result[2]!.when).toBeUndefined();
  });

  it("should handle empty custom commands", () => {
    const result = generatePreserveDefaultBindings("ctrl+s", []);

    expect(result.length).toBe(0);
  });

  it("should preserve args in commands", () => {
    const result = generatePreserveDefaultBindings("ctrl+h", [
      {
        name: "findReplace",
        when: "editorTextFocus",
        args: { find: "hello", replace: "world" },
      },
    ]);

    expect(result[0]!.args).toEqual({ find: "hello", replace: "world" });
    expect(result[0]!.when).toBe("editorTextFocus");
  });
});
