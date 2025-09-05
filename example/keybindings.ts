import { createBuilder } from "vscode-keybindings-builder";

const builderResult = createBuilder({
  dirname: import.meta.dirname,
  // currentKeybindingPath: "",
  currentKeybindingPath: `${process.env.HOME}/Library/Application Support/Cursor/User/keybindings.json`,
});

const builder = builderResult;

const plus_minus = () => {
  builder
    .key("cmd+=", "clearDefault")
    .command("workbench.action.zoomIn")
    .register();
  builder
    .key("cmd+-", "clearDefault")
    .command("workbench.action.zoomOut")
    .register();
  builder
    .key("cmd+shift+=", "clearDefault")
    .command("workbench.action.minimizeOtherEditors")
    .register();
  builder
    .key("cmd+shift+-", "clearDefault")
    .command("workbench.action.evenEditorWidths")
    .register();
};

const registerTextManipulation = () => {
  builder
    .key("ctrl+shift+cmd+l", "clearDefault")
    .command("editor.action.rename", {
      when: "editorHasRenameProvider && editorTextFocus && !editorReadonly",
    })
    .command("renameFile", {
      when: "filesExplorerFocus && foldersViewVisible && !explorerResourceIsRoot && !explorerResourceReadonly && !inputFocus",
    })
    .register();
  builder
    .key("ctrl+shift+l", "clearDefault")
    .command("workbench.action.changeLanguageMode", {
      when: "editorHasRenameProvider && editorTextFocus && !editorReadonly",
    })
    .register();
  builder
    .key("cmd+ctrl+up", "clearDefault")
    .command("editor.action.moveLinesUpAction", { when: "editorTextFocus" })
    .register();
  builder
    .key("cmd+ctrl+down", "clearDefault")
    .command("editor.action.moveLinesDownAction", { when: "editorTextFocus" })
    .register();
};

const registerQuickOpen = () => {
  builder
    .key("cmd+t", "clearDefault")
    .command("workbench.action.quickOpen")
    .register();
};

const registerWordNavigation = () => {
  builder
    .key("alt+left", "clearDefault")
    .command("subwordNavigation.cursorSubwordLeft", { when: "textInputFocus" })
    .register();
  builder
    .key("alt+shift+left", "clearDefault")
    .command("subwordNavigation.cursorSubwordLeftSelect", {
      when: "textInputFocus",
    })
    .register();
  builder
    .key("ctrl+cmd+left", "clearDefault")
    .command("cursorWordLeft", { when: "editorTextFocus" })
    .register();
  builder
    .key("ctrl+cmd+shift+left", "clearDefault")
    .command("cursorWordLeftSelect", { when: "editorTextFocus" })
    .register();
  builder
    .key("alt+right", "clearDefault")
    .command("subwordNavigation.cursorSubwordRight", { when: "textInputFocus" })
    .register();
  builder
    .key("alt+shift+right", "clearDefault")
    .command("subwordNavigation.cursorSubwordRightSelect", {
      when: "textInputFocus",
    })
    .register();
  builder
    .key("ctrl+cmd+right", "clearDefault")
    .command("cursorWordRight", { when: "editorTextFocus" })
    .register();
  builder
    .key("ctrl+cmd+shift+right", "clearDefault")
    .command("cursorWordRightSelect", { when: "editorTextFocus" })
    .register();
};

const registerSelection = () => {
  builder
    .key("shift+cmd+d", "clearDefault")
    .command("editor.action.selectHighlights", { when: "editorFocus" })
    .register();
  builder
    .key("alt+up", "clearDefault")
    .command("editor.action.insertCursorAbove", { when: "editorTextFocus" })
    .register();
  builder
    .key("alt+down", "clearDefault")
    .command("editor.action.insertCursorBelow", { when: "editorTextFocus" })
    .register();
};

const registerCodeNavigation = () => {
  builder
    .key("ctrl+enter", "clearDefault")
    .command("editor.action.goToDeclaration", {
      when: "editorHasDefinitionProvider && editorTextFocus && !isInEmbeddedEditor",
    })
    .register();
  builder
    .key("alt+enter", "clearDefault")
    .command("editor.action.showHover", { when: "editorTextFocus" })
    .register();
};

const registerDeleteOperations = () => {
  builder
    .key("ctrl+cmd+backspace", "clearDefault")
    .command("editor.action.deleteLines", { when: "editorTextFocus" })
    .register();
  builder
    .key("backspace", "preserveDefault")
    .command("moveFileToTrash", { when: "filesExplorerFocus && !inputFocus" })
    .register();
};

const registerEmmet = () => {
  builder.key("cmd+e", "clearDefault").register();
};

const registerExplorer = () => {
  builder
    .key("a", "clearDefault")
    .command("explorer.newFile", { when: "filesExplorerFocus && !inputFocus" })
    .register();
  builder
    .key("shift+a", "clearDefault")
    .command("explorer.newFolder", {
      when: "filesExplorerFocus && !inputFocus",
    })
    .register();
  builder
    .key("ctrl+space", "clearDefault")
    .command("explorer.openAndPassFocus", {
      when: "filesExplorerFocus && foldersViewVisible && !explorerResourceIsFolder && !inputFocus",
    })
    .register();
};

const registerSettings = () => {
  builder
    .key("ctrl+shift+cmd+,", "clearDefault")
    .command("workbench.action.openGlobalSettings")
    .register();
};

const registerNavigation = () => {
  builder
    .key("cmd+[", "clearDefault")
    .command("workbench.action.navigateBack", { when: "canNavigateBack" })
    .register();
  builder
    .key("cmd+]", "clearDefault")
    .command("workbench.action.navigateForward", { when: "canNavigateForward" })
    .register();
};

const registerGit = () => {
  builder
    .key("shift+cmd+[", "clearDefault")
    .command("gitlens.diffWithPrevious", {
      when: "editorTextFocus && config.gitlens.keymap == 'chorded' && resource in 'gitlens:tabs:tracked'",
    })
    .register();
  builder
    .key("shift+cmd+]", "clearDefault")
    .command("gitlens.diffWithNext", {
      when: "editorTextFocus && gitlens:enabled && config.gitlens.keymap == 'chorded' && resourceScheme =~ /^(gitlens|git|pr)$/",
    })
    .register();
  builder
    .key("shift+cmd+g", "clearDefault")
    .command("workbench.view.scm", { when: "workbench.scm.active" })
    .register();
};

const registerIntelliSense = () => {
  builder
    .key("cmd+enter", "clearDefault")
    .command("editor.action.acceptCursorTabSuggestion", {
      when: "cpp.shouldAcceptTab && !searchViewletFocus",
    })
    .register();
};

const registerSmartSelect = () => {
  builder
    .key("shift+cmd+;", "clearDefault")
    .command("editor.action.smartSelect.expand", { when: "editorTextFocus" })
    .register();
};

const registerWindowManagement = () => {
  builder
    .key("ctrl+w", "clearDefault")
    .command("workbench.action.switchWindow")
    .register();

  builder
    .key("cmd+ctrl+enter", "clearDefault")
    .command("workbench.action.toggleMaximizeEditorGroup", {
      when: "editorPartMultipleEditorGroups",
    })
    .command("workbench.action.evenEditorWidths", {
      when: "editorPartMaximizedEditorGroup",
    })
    .register();

  const right = ["ctrl+'", "ctrl+alt+'", "ctrl+right"];
  const left = ["ctrl+l", "ctrl+alt+l", "ctrl+left"];

  for (const key of right) {
    builder
      .key(key, "clearDefault")
      .command("workbench.action.focusFirstEditorGroup", {
        when: "!editorFocus",
      })
      .command("workbench.action.focusRightGroup", { when: "editorFocus" })
      .register();
  }

  for (const key of left) {
    builder
      .key(key, "clearDefault")
      .command("search.action.focusSearchList", {
        when: "!editorFocus && searchViewletVisible",
      })
      .command("workbench.action.focusSideBar", {
        when: "editorFocus && activeEditorGroupIndex == 1 && sideBarVisible",
      })
      .command("workbench.action.focusLeftGroup", {
        when: "editorFocus && activeEditorGroupIndex > 1",
      })
      .register();
  }
};

const registerCopyPath = () => {
  builder
    .key("cmd+ctrl+shift+c", "clearDefault")
    .command("copyRelativeFilePath")
    .register();
  builder
    .key("shift+cmd+c", "clearDefault")
    .command("gitlens.copyRemoteFileUrlToClipboard")
    .register();
};

const registerReferences = () => {
  builder
    .key("ctrl+space", "preserveDefault")
    .command("revealReference", {
      when: "listFocus && referenceSearchVisible && !inputFocus && !treeElementCanCollapse && !treeElementCanExpand && !treestickyScrollFocused",
    })
    .register();
};

plus_minus();
registerTextManipulation();
registerQuickOpen();
registerWordNavigation();
registerSelection();
registerWordNavigation();
registerCodeNavigation();
registerDeleteOperations();
registerEmmet();
registerExplorer();
registerSettings();
registerNavigation();
registerGit();
registerIntelliSense();
registerSmartSelect();
registerWindowManagement();
registerCopyPath();
registerReferences();

builder.build().then((result) => {
  if (result.isErr()) {
    console.error("Build failed:", result.error);
    process.exit(1);
  }
  console.log("Build successful:", result.value);
});
