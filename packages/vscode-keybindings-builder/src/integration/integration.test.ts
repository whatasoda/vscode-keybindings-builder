import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "fs";
import { existsSync } from "fs";
import * as os from "os";
import * as path from "path";
import { createBuilder } from "../index";

describe("End-to-end integration", () => {
  let tempDir: string;
  const fixturesDir = path.join(__dirname, "fixtures");

  beforeEach(() => {
    // Create a temporary directory for test outputs
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "keybindings-test-"));

    // Copy fixtures to temp directory
    fs.copyFileSync(
      path.join(fixturesDir, "default-keybindings.jsonc"),
      path.join(tempDir, "default-keybindings.jsonc"),
    );
    fs.copyFileSync(
      path.join(fixturesDir, "current-keybindings.json"),
      path.join(tempDir, "current-keybindings.json"),
    );
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("should handle complete workflow with default keybindings", async () => {
    const builder = createBuilder({
      dirname: tempDir,
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    // Register some keybindings
    const key1 = builder.key("ctrl+p", "clearDefault");
    const cmd1 = key1.command("myExtension.quickOpen", { when: "editorFocus" });
    const result1 = cmd1.register();
    expect(result1.isOk()).toBe(true);

    const key2 = builder.key("ctrl+shift+n", "preserveDefault");
    const cmd2 = key2.command("myExtension.newFile");
    const result2 = cmd2.register();
    expect(result2.isOk()).toBe(true);

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
        (kb: any) => kb.key === "ctrl+p" && kb.command === "-workbench.action.quickOpen",
      );
      expect(disableCommand).toBeDefined();

      // Should have custom command for ctrl+p
      const customCommand = content.find(
        (kb: any) => kb.key === "ctrl+p" && kb.command === "myExtension.quickOpen",
      );
      expect(customCommand).toBeDefined();
      expect(customCommand.when).toBe("editorFocus");
    }
  });

  it("should handle workflow with current keybindings", async () => {
    const builder = createBuilder({
      dirname: tempDir,
      currentKeybindingPath: path.join(tempDir, "current-keybindings.json"),
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    // Register keybinding that doesn't conflict
    const key1 = builder.key("ctrl+shift+x", "clearDefault");
    const cmd1 = key1.command("myExtension.customCommand");
    const result1 = cmd1.register();
    expect(result1.isOk()).toBe(true);

    const buildResult = await builder.build();
    expect(buildResult.isOk()).toBe(true);

    if (buildResult.isOk()) {
      // Should preserve non-conflicting manual keybindings
      const outputPath = path.join(tempDir, "output.json");
      const content = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

      // Check preserved keybindings
      const preserved = content.find(
        (kb: any) => kb.key === "ctrl+k ctrl+t" && kb.command === "workbench.action.selectTheme",
      );
      expect(preserved).toBeDefined();

      expect(buildResult.value.warnings.length).toBeGreaterThan(0);
    }
  });

  it("should generate output with warnings when same key has different commands", async () => {
    const builder = createBuilder({
      dirname: tempDir,
      currentKeybindingPath: path.join(tempDir, "current-keybindings.json"),
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    // Register keybinding that conflicts with manual (different command)
    const key1 = builder.key("ctrl+p", "clearDefault");
    const cmd1 = key1.command("differentCommand"); // Different from manual's "myExtension.quickOpen"
    const result1 = cmd1.register();
    expect(result1.isOk()).toBe(true);

    const buildResult = await builder.build();
    expect(buildResult.isOk()).toBe(true);

    if (buildResult.isOk()) {
      // Check that warnings contain the conflict
      expect(buildResult.value.warnings.length).toBeGreaterThan(0);
      const conflictWarning = buildResult.value.warnings.find((w) =>
        w.includes("Conflict detected"),
      );
      expect(conflictWarning).toBeDefined();
      expect(conflictWarning).toContain("ctrl+p");

      // Check that output file was still generated
      const outputPath = path.join(tempDir, "output.json");
      const outputExists = existsSync(outputPath);
      expect(outputExists).toBe(true);
    }
  });

  it("should NOT fail when same key has same command", async () => {
    const builder = createBuilder({
      dirname: tempDir,
      currentKeybindingPath: path.join(tempDir, "current-keybindings.json"),
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    // Register keybinding with same command as manual
    const key1 = builder.key("ctrl+p", "clearDefault");
    const cmd1 = key1.command("myExtension.quickOpen"); // Same as manual keybinding
    const result1 = cmd1.register();
    expect(result1.isOk()).toBe(true);

    const buildResult = await builder.build();
    expect(buildResult.isOk()).toBe(true);

    if (buildResult.isOk()) {
      const outputPath = path.join(tempDir, "output.json");
      const content = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

      // Should have the disable command and the custom command
      const disableCommand = content.find(
        (kb: any) => kb.key === "ctrl+p" && kb.command === "-workbench.action.quickOpen",
      );
      expect(disableCommand).toBeDefined();

      const customCommand = content.find(
        (kb: any) => kb.key === "ctrl+p" && kb.command === "myExtension.quickOpen",
      );
      expect(customCommand).toBeDefined();
    }
  });

  it("should preserve non-conflicting manual keybindings", async () => {
    const builder = createBuilder({
      dirname: tempDir,
      currentKeybindingPath: path.join(tempDir, "current-keybindings.json"),
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    // Register something that doesn't conflict
    const key1 = builder.key("f1", "overrideDefault");
    const cmd1 = key1.command("myExtension.help");
    const result1 = cmd1.register();
    expect(result1.isOk()).toBe(true);

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
    const builder = createBuilder({
      dirname: tempDir,
      defaultKeybindingsFile: "default-keybindings.jsonc",
      outputFile: "output.json",
    });

    // Clear default
    const key1 = builder.key("ctrl+x", "clearDefault");
    const cmd1 = key1.command("myExtension.customCut");
    cmd1.register();

    // Preserve default
    const key2 = builder.key("ctrl+c", "preserveDefault");
    const cmd2 = key2.command("myExtension.customCopy", { when: "myCondition" });
    cmd2.register();

    // Override default
    const key3 = builder.key("ctrl+v", "overrideDefault");
    const cmd3 = key3.command("myExtension.customPaste");
    cmd3.register();

    const buildResult = await builder.build();
    expect(buildResult.isOk()).toBe(true);

    if (buildResult.isOk()) {
      const outputPath = path.join(tempDir, "output.json");
      const content = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

      // Check clearDefault: should have disable + custom
      const ctrlXDisable = content.find(
        (kb: any) => kb.key === "ctrl+x" && kb.command === "-editor.action.clipboardCutAction",
      );
      expect(ctrlXDisable).toBeDefined();

      // Check preserveDefault: should only have custom
      const ctrlCCustom = content.find(
        (kb: any) => kb.key === "ctrl+c" && kb.command === "myExtension.customCopy",
      );
      expect(ctrlCCustom).toBeDefined();
      expect(ctrlCCustom.when).toBe("myCondition");

      // Check no disable for preserve
      const ctrlCDisable = content.find(
        (kb: any) => kb.key === "ctrl+c" && kb.command.startsWith("-"),
      );
      expect(ctrlCDisable).toBeUndefined();

      // Check overrideDefault: should have disable + custom
      const ctrlVDisable = content.find(
        (kb: any) => kb.key === "ctrl+v" && kb.command === "-editor.action.clipboardPasteAction",
      );
      expect(ctrlVDisable).toBeDefined();
    }
  });

  it("should handle missing default keybindings file", async () => {
    const builder = createBuilder({
      dirname: tempDir,
      defaultKeybindingsFile: "non-existent.jsonc",
      outputFile: "output.json",
    });

    const key1 = builder.key("ctrl+p", "clearDefault");
    const cmd1 = key1.command("myCommand");
    cmd1.register();

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
