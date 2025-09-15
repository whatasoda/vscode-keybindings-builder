import { describe, expect, it, spyOn } from "bun:test";
import { createBuilder } from "./index";

describe("createBuilder", () => {
  it("should create a builder instance with required config", () => {
    const builder = createBuilder({ dirname: "/test/path" });
    expect(builder).toBeDefined();
    expect(typeof builder.key).toBe("function");
    expect(typeof builder.build).toBe("function");
    expect(typeof builder.getConfig).toBe("function");
    expect(typeof builder.getRegisteredKeys).toBe("function");
  });

  it("should exit process when config is invalid", () => {
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

    expect(() => createBuilder({} as any)).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleSpy).toHaveBeenCalled();

    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("should use default values for optional config fields", () => {
    const builder = createBuilder({ dirname: "/test/path" });
    const config = builder.getConfig();
    expect(config.defaultKeybindingsFile).toBe("default-keybindings.jsonc");
    expect(config.outputFile).toBe("keybindings-generated.json");
  });

  it("should accept custom config values", () => {
    const builder = createBuilder({
      dirname: "/test/path",
      defaultKeybindingsFile: "custom-defaults.jsonc",
      outputFile: "custom-output.json",
    });
    const config = builder.getConfig();
    expect(config.dirname).toBe("/test/path");
    expect(config.defaultKeybindingsFile).toBe("custom-defaults.jsonc");
    expect(config.outputFile).toBe("custom-output.json");
  });

  it("should exit process for invalid dirname type", () => {
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      createBuilder({
        dirname: 123 as any, // Should be string
      }),
    ).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleSpy).toHaveBeenCalled();

    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("should accept currentKeybindingPath", () => {
    const builder = createBuilder({
      dirname: "/test/path",
      currentKeybindingPath: "/custom/keybindings.json",
    });
    const config = builder.getConfig();
    expect(config.currentKeybindingPath).toBe("/custom/keybindings.json");
  });
});
