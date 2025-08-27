import { createBuilder } from "vscode-keyboard-builder";

const builder = createBuilder({
  dirname: import.meta.dirname,
  currentKeybindingPath: "",
});

const registerZoom = () => {
  builder
    .key("cmd+numpad_add", "clearDefault")
    .command("workbench.action.zoomIn", { when: "editorTextFocus" })
    .command("workbench.action.zoomIn", { when: "editorTextFocus" })
    .register();

  builder
    .key("cmd+numpad_subtract", "preserveDefault")
    .command("workbench.action.zoomOut", { when: "editorTextFocus" })
    .register();

  builder
    .key("cmd+numpad0", "presetDefault")
    .command("workbench.action.zoomReset", { when: "editorTextFocus" })
    .register();
};

registerZoom();

builder.build();
