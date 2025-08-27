// @ts-ignore - Example file, import resolution handled at runtime
import { createBuilder } from "vscode-keybindings-builder";

const builderResult = createBuilder({
  dirname: import.meta.dirname,
  currentKeybindingPath: "",
});

if (builderResult.isErr()) {
  console.error("Failed to create builder:", builderResult.error);
  process.exit(1);
}

const builder = builderResult.value;

const registerZoom = () => {
  const key1 = builder.key("cmd+numpad_add", "clearDefault");
  if (key1.isOk()) {
    const cmd1 = key1.value.command("workbench.action.zoomIn", { when: "editorTextFocus" });
    if (cmd1.isOk()) {
      cmd1.value.register();
    }
  }

  const key2 = builder.key("cmd+numpad_subtract", "preserveDefault");
  if (key2.isOk()) {
    const cmd2 = key2.value.command("workbench.action.zoomOut", { when: "editorTextFocus" });
    if (cmd2.isOk()) {
      cmd2.value.register();
    }
  }

  const key3 = builder.key("cmd+numpad0", "preserveDefault");
  if (key3.isOk()) {
    const cmd3 = key3.value.command("workbench.action.zoomReset", { when: "editorTextFocus" });
    if (cmd3.isOk()) {
      cmd3.value.register();
    }
  }
};

registerZoom();

builder.build().then((result) => {
  if (result.isErr()) {
    console.error("Build failed:", result.error);
    process.exit(1);
  }
  console.log("Build successful:", result.value);
});