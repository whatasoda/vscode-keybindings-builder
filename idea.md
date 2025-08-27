# vscode-keyboard-builder

## Idea

- Create a library that allows you to build VSCode keybindings.
- The library allows user to maintain vscode keybindings easily.
- The library can disable default keybindings and only keep the user's keybindings.

## Prerequisites

- User manually provides a default keybindings file, so that the library can generate proper content to disable default keybindings.
- The library does not overwrite user's keybindings automatically. User need to update the keybindings file manually.

## Example

```ts
import { createBuilder } from "vscode-keyboard-builder";

// Necessary arguments
const builder = createBuilder({
  dirname: import.meta.dirname,
  currentKeybindingPath: "",
});

// User can group keys by wrapping them in a function
const registerZoom = () => {
  builder
    .key(
      // User can configure per key
      "cmd+numpad_add",
      // User can select how to treat default keybindings
      // Internal Behavior Note: the library need to understand the default keybindings file which is jsonc.
      "clearDefault"
    )
    // User can add commands by method chaining
    .command("workbench.action.zoomIn", { when: "editorTextFocus" })
    .command("workbench.action.zoomIn", { when: "editorTextFocus" })
    // User need to call register method at the end of definition
    // No need to keep the return value of register method. State will be updated automatically.
    .register();

  builder
    // Internal Behavior Note: if the same key is tried to be registered, build will fail and emit all errors to stderr.
    .key("cmd+numpad_subtract", "preserveDefault")
    .command("workbench.action.zoomOut", { when: "editorTextFocus" })
    .register();

  builder
    .key("cmd+numpad0", "presetDefault")
    .command("workbench.action.zoomReset", { when: "editorTextFocus" })
    .register();
};

// If user wrap keys in a function, user need to call the function to register the keybindings.
registerZoom();

// User can call build method to generate the keybindings file.
builder.build();
```

By executing the file with bun, the library will generate the keybindings file in the same directory.
The library expects the default keybindings file to be in the same directory, named `default-keybindings.jsonc`.
