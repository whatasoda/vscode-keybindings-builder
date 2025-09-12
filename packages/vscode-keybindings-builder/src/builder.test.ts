import { describe, expect, it } from "bun:test";
import { createKeybindingsBuilder } from "./builder";
import type { BuilderConfig } from "./types";

describe("KeybindingBuilder.key()", () => {
  const config: BuilderConfig = {
    dirname: "/test/path",
    defaultKeybindingsFile: "default-keybindings.jsonc",
    outputFile: "keybindings-generated.json",
  };

  it("should accept a key combination and mode", () => {
    const builder = createKeybindingsBuilder(config);
    const keyBuilder = builder.key("ctrl+p", "clearDefault");
    expect(keyBuilder).toBeDefined();
    expect(typeof keyBuilder.command).toBe("function");
    expect(typeof keyBuilder.register).toBe("function");
  });

  it("should return builder instance for chaining", () => {
    const builder = createKeybindingsBuilder(config);
    const keyBuilder = builder.key("ctrl+shift+p", "preserveDefault");
    expect(keyBuilder).toBeDefined();
    
    const afterCommand = keyBuilder.command("test");
    expect(afterCommand).toBe(keyBuilder); // Should return same instance for chaining
  });

  it("should defer validation until register", () => {
    const builder = createKeybindingsBuilder(config);
    // Invalid key should still return a builder
    const keyBuilder = builder.key("invalid++key", "clearDefault");
    expect(keyBuilder).toBeDefined();
    
    // But register should fail
    const result = keyBuilder.register();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("INVALID_KEY_FORMAT");
    }
  });

  it("should accept 'clearDefault', 'preserveDefault', and 'overrideDefault' modes", () => {
    const builder = createKeybindingsBuilder(config);

    const clear = builder.key("ctrl+a", "clearDefault");
    expect(clear).toBeDefined();
    expect(clear.register().isOk()).toBe(true);

    const preserve = builder.key("ctrl+b", "preserveDefault");
    expect(preserve).toBeDefined();
    expect(preserve.register().isOk()).toBe(true);

    const override = builder.key("ctrl+c", "overrideDefault");
    expect(override).toBeDefined();
    expect(override.register().isOk()).toBe(true);
  });

  it("should accept valid special keys", () => {
    const builder = createKeybindingsBuilder(config);

    const arrow = builder.key("ctrl+left", "clearDefault");
    expect(arrow.register().isOk()).toBe(true);

    const func = builder.key("f1", "preserveDefault");
    expect(func.register().isOk()).toBe(true);

    const special = builder.key("escape", "overrideDefault");
    expect(special.register().isOk()).toBe(true);
  });

  it("should accept chord sequences", () => {
    const builder = createKeybindingsBuilder(config);
    const keyBuilder = builder.key("ctrl+k ctrl+s", "clearDefault");
    const result = keyBuilder.register();
    expect(result.isOk()).toBe(true);
  });

  it("should validate each part of the key combination", () => {
    const builder = createKeybindingsBuilder(config);
    const keyBuilder = builder.key("ctrl+invalid_key", "clearDefault");
    const result = keyBuilder.register();
    expect(result.isErr()).toBe(true);
    if (result.isErr() && result.error.type === "INVALID_KEY_FORMAT") {
      expect(result.error.reason).toContain("Invalid key part");
    }
  });
});

describe("KeybindingBuilder.command()", () => {
  const config: BuilderConfig = {
    dirname: "/test/path",
    defaultKeybindingsFile: "default-keybindings.jsonc",
    outputFile: "keybindings-generated.json",
  };

  it("should add a command to the current key", () => {
    const builder = createKeybindingsBuilder(config);
    const keyBuilder = builder.key("ctrl+p", "clearDefault");
    const afterCommand = keyBuilder.command("workbench.action.quickOpen");
    expect(afterCommand).toBe(keyBuilder); // Should return same instance
    
    const result = afterCommand.register();
    expect(result.isOk()).toBe(true);
  });

  it("should accept optional 'when' condition", () => {
    const builder = createKeybindingsBuilder(config);
    const keyBuilder = builder.key("ctrl+p", "clearDefault");
    const afterCommand = keyBuilder.command("workbench.action.quickOpen", {
      when: "editorTextFocus",
    });
    
    const result = afterCommand.register();
    expect(result.isOk()).toBe(true);
  });

  it("should return builder instance for chaining", () => {
    const builder = createKeybindingsBuilder(config);
    const keyBuilder = builder.key("ctrl+p", "clearDefault");
    const afterCommand = keyBuilder.command("workbench.action.quickOpen");
    expect(afterCommand).toBe(keyBuilder);
  });

  it("should allow multiple commands for the same key", () => {
    const builder = createKeybindingsBuilder(config);
    const keyBuilder = builder.key("ctrl+p", "clearDefault");

    const afterCmd1 = keyBuilder.command("command1");
    expect(afterCmd1).toBe(keyBuilder);

    const afterCmd2 = afterCmd1.command("command2", { when: "condition1" });
    expect(afterCmd2).toBe(keyBuilder);

    const afterCmd3 = afterCmd2.command("command3", { when: "condition2" });
    expect(afterCmd3).toBe(keyBuilder);

    const result = afterCmd3.register();
    expect(result.isOk()).toBe(true);
  });

  it("should accept args parameter", () => {
    const builder = createKeybindingsBuilder(config);
    const keyBuilder = builder.key("ctrl+h", "clearDefault");

    const afterCommand = keyBuilder.command("editor.action.startFindReplaceAction", {
      args: { query: "hello", replace: "world" },
    });
    
    const result = afterCommand.register();
    expect(result.isOk()).toBe(true);
  });
});

describe("KeybindingBuilder.register()", () => {
  const config: BuilderConfig = {
    dirname: "/test/path",
    defaultKeybindingsFile: "default-keybindings.jsonc",
    outputFile: "keybindings-generated.json",
  };

  it("should finalize the key binding definition", () => {
    const builder = createKeybindingsBuilder(config);
    const result = builder
      .key("ctrl+p", "clearDefault")
      .command("workbench.action.quickOpen")
      .register();

    expect(result.isOk()).toBe(true);
    expect(builder.getRegisteredKeys().has("ctrl+p")).toBe(true);
  });

  it("should return error for duplicate keys", () => {
    const builder = createKeybindingsBuilder(config);

    // Register first key
    const result1 = builder.key("ctrl+p", "clearDefault").register();
    expect(result1.isOk()).toBe(true);

    // Try to register same key again
    const result2 = builder.key("ctrl+p", "preserveDefault").register();
    expect(result2.isErr()).toBe(true);
    if (result2.isErr() && result2.error.type === "DUPLICATE_KEY") {
      expect(result2.error.key).toBe("ctrl+p");
    }
  });

  it("should store the registered key with all its properties", () => {
    const builder = createKeybindingsBuilder(config);

    builder
      .key("ctrl+p", "clearDefault")
      .command("command1", { when: "condition1" })
      .command("command2", { when: "condition2" })
      .register();

    const registered = builder.getRegisteredKeys();
    expect(registered.size).toBe(1);

    const key = registered.get("ctrl+p");
    expect(key).toBeDefined();
    if (key) {
      expect(key.key).toBe("ctrl+p");
      expect(key.mode).toBe("clearDefault");
      expect(key.commands.length).toBe(2);
      expect(key.commands[0]?.name).toBe("command1");
      expect(key.commands[1]?.name).toBe("command2");
    }
  });

  it("should work without any commands", () => {
    const builder = createKeybindingsBuilder(config);
    const result = builder.key("escape", "clearDefault").register();
    expect(result.isOk()).toBe(true);

    const registered = builder.getRegisteredKeys();
    const key = registered.get("escape");
    expect(key).toBeDefined();
    if (key) {
      expect(key.commands.length).toBe(0);
    }
  });

  it("should normalize key before checking duplicates", () => {
    const builder = createKeybindingsBuilder(config);

    // Register with one format
    const result1 = builder.key("ctrl+shift+p", "clearDefault").register();
    expect(result1.isOk()).toBe(true);

    // Try to register with different format (should be duplicate)
    const result2 = builder.key("shift+ctrl+p", "clearDefault").register();
    expect(result2.isErr()).toBe(true);
    if (result2.isErr() && result2.error.type === "DUPLICATE_KEY") {
      expect(result2.error.key).toBe("shift+ctrl+p");
    }
  });
});