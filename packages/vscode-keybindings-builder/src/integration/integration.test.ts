import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createBuilder } from "../index";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("End-to-end integration", () => {
  let tempDir: string;
  const fixturesDir = path.join(__dirname, "fixtures");

  beforeEach(() => {
    // Create a temporary directory for test outputs
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "keybindings-test-"));
    
    // Copy fixtures to temp directory
    fs.copyFileSync(
      path.join(fixturesDir, "default-keybindings.jsonc"),
      path.join(tempDir, "default-keybindings.jsonc")
    );
    fs.copyFileSync(
      path.join(fixturesDir, "current-keybindings.json"),
      path.join(tempDir, "current-keybindings.json")
    );
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("should handle complete workflow with default keybindings", async () => {
    const builderResult = createBuilder({
      dirname: tempDir,
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    expect(builderResult.isOk()).toBe(true);
    if (!builderResult.isOk()) return;

    const builder = builderResult.value;

    // Register some keybindings
    const key1 = builder.key("ctrl+p", "clearDefault");
    if (key1.isOk()) {
      const cmd1 = key1.value.command("myExtension.quickOpen", { when: "editorFocus" });
      if (cmd1.isOk()) {
        cmd1.value.register();
      }
    }

    const key2 = builder.key("ctrl+shift+n", "preserveDefault");
    if (key2.isOk()) {
      const cmd2 = key2.value.command("myExtension.newFile");
      if (cmd2.isOk()) {
        cmd2.value.register();
      }
    }

    const buildResult = await builder.build();
    expect(buildResult.isOk()).toBe(true);

    if (buildResult.isOk()) {
      expect(buildResult.value.type).toBe("BUILD_SUCCESS");
      expect(buildResult.value.keybindingsCount).toBe(2);

      // Verify output file was created
      const outputPath = path.join(tempDir, "output.json");
      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify content
      const content = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
      expect(Array.isArray(content)).toBe(true);
      
      // Should have disable command for ctrl+p default
      const disableCommand = content.find(
        (kb: any) => kb.key === "ctrl+p" && kb.command === "-workbench.action.quickOpen"
      );
      expect(disableCommand).toBeDefined();

      // Should have custom command for ctrl+p
      const customCommand = content.find(
        (kb: any) => kb.key === "ctrl+p" && kb.command === "myExtension.quickOpen"
      );
      expect(customCommand).toBeDefined();
      expect(customCommand.when).toBe("editorFocus");
    }
  });

  it("should handle workflow with current keybindings", async () => {
    const builderResult = createBuilder({
      dirname: tempDir,
      currentKeybindingPath: path.join(tempDir, "current-keybindings.json"),
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    expect(builderResult.isOk()).toBe(true);
    if (!builderResult.isOk()) return;

    const builder = builderResult.value;

    // Register keybinding that doesn't conflict
    const key1 = builder.key("ctrl+shift+x", "clearDefault");
    if (key1.isOk()) {
      const cmd1 = key1.value.command("myExtension.customCommand");
      if (cmd1.isOk()) {
        cmd1.value.register();
      }
    }

    const buildResult = await builder.build();
    expect(buildResult.isOk()).toBe(true);

    if (buildResult.isOk()) {
      // Should preserve non-conflicting manual keybindings
      const outputPath = path.join(tempDir, "output.json");
      const content = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
      
      // Check preserved keybindings
      const preserved = content.find(
        (kb: any) => kb.key === "ctrl+k ctrl+t" && kb.command === "workbench.action.selectTheme"
      );
      expect(preserved).toBeDefined();
      
      expect(buildResult.value.warnings.length).toBeGreaterThan(0);
    }
  });

  it("should fail on conflicts between builder and manual", async () => {
    const builderResult = createBuilder({
      dirname: tempDir,
      currentKeybindingPath: path.join(tempDir, "current-keybindings.json"),
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    expect(builderResult.isOk()).toBe(true);
    if (!builderResult.isOk()) return;

    const builder = builderResult.value;

    // Register keybinding that conflicts with manual
    const key1 = builder.key("ctrl+p", "clearDefault"); // This conflicts with manual keybinding
    if (key1.isOk()) {
      const cmd1 = key1.value.command("differentCommand");
      if (cmd1.isOk()) {
        cmd1.value.register();
      }
    }

    const buildResult = await builder.build();
    expect(buildResult.isErr()).toBe(true);

    if (buildResult.isErr()) {
      expect(buildResult.error.type).toBe("CONFLICT_DETECTED");
      if (buildResult.error.type === "CONFLICT_DETECTED") {
        expect(buildResult.error.conflicts.length).toBe(1);
        expect(buildResult.error.conflicts[0].key).toBe("ctrl+p");
      }
    }
  });

  it("should preserve non-conflicting manual keybindings", async () => {
    const builderResult = createBuilder({
      dirname: tempDir,
      currentKeybindingPath: path.join(tempDir, "current-keybindings.json"),
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    expect(builderResult.isOk()).toBe(true);
    if (!builderResult.isOk()) return;

    const builder = builderResult.value;

    // Register something that doesn't conflict
    const key1 = builder.key("f1", "overrideDefault");
    if (key1.isOk()) {
      const cmd1 = key1.value.command("myExtension.help");
      if (cmd1.isOk()) {
        cmd1.value.register();
      }
    }

    const buildResult = await builder.build();
    expect(buildResult.isOk()).toBe(true);

    if (buildResult.isOk()) {
      const outputPath = path.join(tempDir, "output.json");
      const content = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

      // All 3 manual keybindings should be preserved
      const manualKeys = ["ctrl+k ctrl+t", "alt+shift+f"];
      // ctrl+p is not included since we didn't register it
      
      for (const key of manualKeys) {
        const found = content.find((kb: any) => kb.key === key);
        expect(found).toBeDefined();
      }
    }
  });

  it("should generate correct output for mixed modes", async () => {
    const builderResult = createBuilder({
      dirname: tempDir,
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    expect(builderResult.isOk()).toBe(true);
    if (!builderResult.isOk()) return;

    const builder = builderResult.value;

    // Clear default
    const key1 = builder.key("ctrl+x", "clearDefault");
    if (key1.isOk()) {
      const cmd1 = key1.value.command("myExtension.customCut");
      if (cmd1.isOk()) {
        cmd1.value.register();
      }
    }

    // Preserve default
    const key2 = builder.key("ctrl+c", "preserveDefault");
    if (key2.isOk()) {
      const cmd2 = key2.value.command("myExtension.customCopy", { when: "myCondition" });
      if (cmd2.isOk()) {
        cmd2.value.register();
      }
    }

    // Override default
    const key3 = builder.key("ctrl+v", "overrideDefault");
    if (key3.isOk()) {
      const cmd3 = key3.value.command("myExtension.customPaste");
      if (cmd3.isOk()) {
        cmd3.value.register();
      }
    }

    const buildResult = await builder.build();
    expect(buildResult.isOk()).toBe(true);

    if (buildResult.isOk()) {
      const outputPath = path.join(tempDir, "output.json");
      const content = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

      // Check clearDefault: should have disable + custom
      const ctrlXDisable = content.find(
        (kb: any) => kb.key === "ctrl+x" && kb.command === "-editor.action.clipboardCutAction"
      );
      expect(ctrlXDisable).toBeDefined();

      // Check preserveDefault: should only have custom
      const ctrlCCustom = content.find(
        (kb: any) => kb.key === "ctrl+c" && kb.command === "myExtension.customCopy"
      );
      expect(ctrlCCustom).toBeDefined();
      expect(ctrlCCustom.when).toBe("myCondition");

      // Check no disable for preserve
      const ctrlCDisable = content.find(
        (kb: any) => kb.key === "ctrl+c" && kb.command.startsWith("-")
      );
      expect(ctrlCDisable).toBeUndefined();

      // Check overrideDefault: should have disable + custom
      const ctrlVDisable = content.find(
        (kb: any) => kb.key === "ctrl+v" && kb.command === "-editor.action.clipboardPasteAction"
      );
      expect(ctrlVDisable).toBeDefined();
    }
  });

  it("should handle missing default keybindings file", async () => {
    const builderResult = createBuilder({
      dirname: tempDir,
      defaultKeybindingsFile: "non-existent.jsonc",
      outputFile: "output.json",
    });

    expect(builderResult.isOk()).toBe(true);
    if (!builderResult.isOk()) return;

    const builder = builderResult.value;

    const key1 = builder.key("ctrl+p", "clearDefault");
    if (key1.isOk()) {
      const cmd1 = key1.value.command("myCommand");
      if (cmd1.isOk()) {
        cmd1.value.register();
      }
    }

    const buildResult = await builder.build();
    
    // Should succeed with warning, using empty defaults
    expect(buildResult.isOk()).toBe(true);
    
    if (buildResult.isOk()) {
      const outputPath = path.join(tempDir, "output.json");
      const content = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
      
      // Should only have the custom command, no disable commands
      expect(content.length).toBe(1);
      expect(content[0].command).toBe("myCommand");
    }
  });
});