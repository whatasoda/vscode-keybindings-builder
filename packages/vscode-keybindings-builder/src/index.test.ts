import { describe, expect, it } from "bun:test";
import { createBuilder } from "./index";

describe("createBuilder", () => {
  it("should create a builder instance with required config", () => {
    const result = createBuilder({ dirname: "/test/path" });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeDefined();
      expect(typeof result.value.key).toBe("function");
      expect(typeof result.value.command).toBe("function");
      expect(typeof result.value.register).toBe("function");
      expect(typeof result.value.build).toBe("function");
    }
  });

  it("should return error when dirname is not provided", () => {
    const result = createBuilder({} as any);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("CONFIG_INVALID");
    }
  });

  it("should use default values for optional config fields", () => {
    const result = createBuilder({ dirname: "/test/path" });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const config = result.value.getConfig();
      expect(config.defaultKeybindingsFile).toBe("default-keybindings.jsonc");
      expect(config.outputFile).toBe("keybindings-generated.json");
    }
  });

  it("should validate config with Zod schema", () => {
    const result = createBuilder({
      dirname: "/test/path",
      defaultKeybindingsFile: "custom-defaults.jsonc",
      outputFile: "custom-output.json",
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const config = result.value.getConfig();
      expect(config.dirname).toBe("/test/path");
      expect(config.defaultKeybindingsFile).toBe("custom-defaults.jsonc");
      expect(config.outputFile).toBe("custom-output.json");
    }
  });

  it("should return validation error for invalid config", () => {
    const result = createBuilder({
      dirname: 123 as any, // Should be string
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("CONFIG_INVALID");
    }
  });
});
