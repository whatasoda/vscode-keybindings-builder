import { describe, it, expect } from "bun:test";
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
    const result = builder.key("ctrl+p", "clearDefault");
    expect(result.isOk()).toBe(true);
  });

  it("should return builder instance for chaining", () => {
    const builder = createKeybindingsBuilder(config);
    const result = builder.key("ctrl+shift+p", "preserveDefault");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(builder);
    }
  });

  it("should throw error for invalid key combination format", () => {
    const builder = createKeybindingsBuilder(config);
    const result = builder.key("invalid++key", "clearDefault");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("INVALID_KEY_FORMAT");
    }
  });

  it("should accept 'clearDefault', 'preserveDefault', and 'overrideDefault' modes", () => {
    const builder = createKeybindingsBuilder(config);
    
    const clear = builder.key("ctrl+a", "clearDefault");
    expect(clear.isOk()).toBe(true);
    
    const preserve = builder.key("ctrl+b", "preserveDefault");
    expect(preserve.isOk()).toBe(true);
    
    const override = builder.key("ctrl+c", "overrideDefault");
    expect(override.isOk()).toBe(true);
  });

  it("should accept valid special keys", () => {
    const builder = createKeybindingsBuilder(config);
    
    const arrow = builder.key("ctrl+left", "clearDefault");
    expect(arrow.isOk()).toBe(true);
    
    const func = builder.key("f1", "preserveDefault");
    expect(func.isOk()).toBe(true);
    
    const special = builder.key("escape", "overrideDefault");
    expect(special.isOk()).toBe(true);
  });

  it("should accept chord sequences", () => {
    const builder = createKeybindingsBuilder(config);
    const result = builder.key("ctrl+k ctrl+s", "clearDefault");
    expect(result.isOk()).toBe(true);
  });

  it("should validate each part of the key combination", () => {
    const builder = createKeybindingsBuilder(config);
    const result = builder.key("ctrl+invalid_key", "clearDefault");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("INVALID_KEY_FORMAT");
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
    const keyResult = builder.key("ctrl+p", "clearDefault");
    expect(keyResult.isOk()).toBe(true);
    
    if (keyResult.isOk()) {
      const cmdResult = keyResult.value.command("workbench.action.quickOpen");
      expect(cmdResult.isOk()).toBe(true);
    }
  });

  it("should accept optional 'when' condition", () => {
    const builder = createKeybindingsBuilder(config);
    const keyResult = builder.key("ctrl+p", "clearDefault");
    expect(keyResult.isOk()).toBe(true);
    
    if (keyResult.isOk()) {
      const cmdResult = keyResult.value.command("workbench.action.quickOpen", {
        when: "editorTextFocus",
      });
      expect(cmdResult.isOk()).toBe(true);
    }
  });

  it("should return builder instance for chaining", () => {
    const builder = createKeybindingsBuilder(config);
    builder.key("ctrl+p", "clearDefault");
    const cmdResult = builder.command("workbench.action.quickOpen");
    
    if (cmdResult.isOk()) {
      expect(cmdResult.value).toBe(builder);
    }
  });

  it("should throw error if called without calling key() first", () => {
    const builder = createKeybindingsBuilder(config);
    const result = builder.command("workbench.action.quickOpen");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NO_KEY_ACTIVE");
      expect(result.error.operation).toBe("command");
    }
  });

  it("should allow multiple commands for the same key", () => {
    const builder = createKeybindingsBuilder(config);
    builder.key("ctrl+p", "clearDefault");
    
    const cmd1 = builder.command("command1");
    expect(cmd1.isOk()).toBe(true);
    
    const cmd2 = builder.command("command2", { when: "condition1" });
    expect(cmd2.isOk()).toBe(true);
    
    const cmd3 = builder.command("command3", { when: "condition2" });
    expect(cmd3.isOk()).toBe(true);
  });

  it("should accept args parameter", () => {
    const builder = createKeybindingsBuilder(config);
    builder.key("ctrl+h", "clearDefault");
    
    const result = builder.command("editor.action.startFindReplaceAction", {
      args: { query: "hello", replace: "world" },
    });
    expect(result.isOk()).toBe(true);
  });
});

describe("KeybindingBuilder.register()", () => {
  const config: BuilderConfig = {
    dirname: "/test/path",
    defaultKeybindingsFile: "default-keybindings.jsonc",
    outputFile: "keybindings-generated.json",
  };

  it("should finalize a keybinding entry", () => {
    const builder = createKeybindingsBuilder(config);
    builder.key("ctrl+p", "clearDefault");
    builder.command("workbench.action.quickOpen");
    
    const result = builder.register();
    expect(result.isOk()).toBe(true);
    
    const registered = builder.getRegisteredKeys();
    expect(registered.size).toBe(1);
  });

  it("should clear current key state after registration", () => {
    const builder = createKeybindingsBuilder(config);
    builder.key("ctrl+p", "clearDefault");
    builder.command("workbench.action.quickOpen");
    builder.register();
    
    // Try to add command without setting new key - should fail
    const result = builder.command("anotherCommand");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NO_KEY_ACTIVE");
    }
  });

  it("should detect duplicate key registrations within builder", () => {
    const builder = createKeybindingsBuilder(config);
    
    // Register first key
    builder.key("ctrl+p", "clearDefault");
    builder.command("command1");
    const first = builder.register();
    expect(first.isOk()).toBe(true);
    
    // Try to register same key again
    builder.key("ctrl+p", "preserveDefault");
    builder.command("command2");
    const second = builder.register();
    expect(second.isErr()).toBe(true);
    if (second.isErr()) {
      expect(second.error.type).toBe("DUPLICATE_KEY");
    }
  });

  it("should throw error when registering the same key twice", () => {
    const builder = createKeybindingsBuilder(config);
    
    // Register first
    builder.key("cmd+k", "clearDefault");
    builder.command("command1");
    builder.register();
    
    // Try again with same key
    builder.key("cmd+k", "overrideDefault");
    builder.command("command2");
    const result = builder.register();
    
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("DUPLICATE_KEY");
      expect(result.error.key).toBe("cmd+k");
      expect(result.error.existingIndex).toBe(0);
    }
  });

  it("should return builder instance for chaining", () => {
    const builder = createKeybindingsBuilder(config);
    builder.key("ctrl+p", "clearDefault");
    builder.command("workbench.action.quickOpen");
    
    const result = builder.register();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(builder);
    }
  });

  it("should handle normalized key comparison for duplicates", () => {
    const builder = createKeybindingsBuilder(config);
    
    // Register with different case/order
    builder.key("Ctrl+Shift+P", "clearDefault");
    builder.command("command1");
    builder.register();
    
    // Try with normalized equivalent
    builder.key("shift+ctrl+p", "preserveDefault");
    builder.command("command2");
    const result = builder.register();
    
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("DUPLICATE_KEY");
    }
  });

  it("should error if register called without key", () => {
    const builder = createKeybindingsBuilder(config);
    const result = builder.register();
    
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NO_KEY_ACTIVE");
      expect(result.error.operation).toBe("register");
    }
  });

  it("should store the registered key with all commands", () => {
    const builder = createKeybindingsBuilder(config);
    builder.key("ctrl+p", "clearDefault");
    builder.command("command1", { when: "condition1" });
    builder.command("command2", { when: "condition2" });
    builder.register();
    
    const registered = builder.getRegisteredKeys();
    const key = Array.from(registered.values())[0];
    
    expect(key.key).toBe("ctrl+p");
    expect(key.mode).toBe("clearDefault");
    expect(key.commands.length).toBe(2);
    expect(key.commands[0].name).toBe("command1");
    expect(key.commands[0].when).toBe("condition1");
    expect(key.commands[1].name).toBe("command2");
    expect(key.commands[1].when).toBe("condition2");
  });
});