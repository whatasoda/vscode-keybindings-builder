import { describe, it, expect } from "bun:test";
import { parseJSON } from "./json";

describe("parseJSON", () => {
  it("should parse valid JSON", () => {
    const content = `[
      { "key": "ctrl+a", "command": "selectAll" }
    ]`;
    const result = parseJSON(content, "test.json");
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value[0].key).toBe("ctrl+a");
    }
  });

  it("should return error for invalid JSON", () => {
    const content = `{ invalid json }`;
    const result = parseJSON(content, "test.json");
    
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("JSON_PARSE_ERROR");
      expect(result.error.path).toBe("test.json");
    }
  });

  it("should parse empty array", () => {
    const content = `[]`;
    const result = parseJSON(content, "test.json");
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it("should preserve all properties", () => {
    const content = `[{
      "key": "ctrl+s",
      "command": "workbench.action.files.save",
      "when": "editorTextFocus",
      "args": { "force": true }
    }]`;
    const result = parseJSON(content, "test.json");
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const kb = result.value[0];
      expect(kb.key).toBe("ctrl+s");
      expect(kb.command).toBe("workbench.action.files.save");
      expect(kb.when).toBe("editorTextFocus");
      expect(kb.args).toEqual({ force: true });
    }
  });
});