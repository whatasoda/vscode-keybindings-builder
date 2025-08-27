import { describe, expect, it } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { parseJSONC } from "./jsonc";

describe("parseJSONC", () => {
  const fixturesPath = path.join(__dirname, "../integration/fixtures");
  const defaultKeybindingsPath = path.join(fixturesPath, "default-keybindings.jsonc");

  it("should parse JSONC file with comments", () => {
    const content = fs.readFileSync(defaultKeybindingsPath, "utf-8");
    const result = parseJSONC(content);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Array.isArray(result.value)).toBe(true);
      expect((result.value as any).length).toBeGreaterThan(0);
    }
  });

  it("should extract all default keybindings", () => {
    const content = fs.readFileSync(defaultKeybindingsPath, "utf-8");
    const result = parseJSONC(content);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect((result.value as any).length).toBe(7);
      expect((result.value as any)[0].key).toBe("ctrl+x");
      expect((result.value as any)[0].command).toBe("editor.action.clipboardCutAction");
    }
  });

  it("should handle single-line comments", () => {
    const content = `
    [
      // This is a comment
      { "key": "ctrl+a", "command": "selectAll" }
    ]
    `;
    const result = parseJSONC(content);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect((result.value as any).length).toBe(1);
      expect((result.value as any)[0].key).toBe("ctrl+a");
    }
  });

  it("should handle multi-line comments", () => {
    const content = `
    [
      /* This is a
         multi-line comment */
      { "key": "ctrl+b", "command": "boldText" }
    ]
    `;
    const result = parseJSONC(content);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect((result.value as any).length).toBe(1);
      expect((result.value as any)[0].key).toBe("ctrl+b");
    }
  });

  it("should handle trailing commas", () => {
    const content = `
    [
      { "key": "ctrl+c", "command": "copy", },
      { "key": "ctrl+v", "command": "paste", },
    ]
    `;
    const result = parseJSONC(content);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect((result.value as any).length).toBe(2);
    }
  });

  it("should throw error for invalid JSONC format", () => {
    const content = `
    [
      { invalid json here }
    ]
    `;
    const result = parseJSONC(content);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("JSONC_PARSE_ERROR");
    }
  });

  it("should handle inline comments", () => {
    const content = `
    [
      { 
        "key": "ctrl+d", // duplicate line
        "command": "editor.action.duplicateLine"
      }
    ]
    `;
    const result = parseJSONC(content);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect((result.value as any).length).toBe(1);
      expect((result.value as any)[0].command).toBe("editor.action.duplicateLine");
    }
  });

  it("should preserve all keybinding properties", () => {
    const content = `
    [
      { 
        "key": "ctrl+e",
        "command": "editor.action.test",
        "when": "editorTextFocus",
        "args": { "test": true }
      }
    ]
    `;
    const result = parseJSONC(content);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const kb = (result.value as any)[0];
      expect(kb.key).toBe("ctrl+e");
      expect(kb.command).toBe("editor.action.test");
      expect(kb.when).toBe("editorTextFocus");
      expect(kb.args).toEqual({ test: true });
    }
  });
});
