# VSCode Keybinding Specification

## Key Format Grammar

### Basic Structure
A keybinding consists of:
- `key`: The keyboard combination to trigger the keybinding
- `command`: The VSCode command to execute
- `when` (optional): Context expression for when the keybinding is active
- `args` (optional): Arguments to pass to the command

### Key Combination Format

#### Modifiers
- `ctrl` / `cmd`: Control key (Windows/Linux) or Command key (Mac)
- `shift`: Shift key
- `alt` / `option`: Alt key (Windows/Linux) or Option key (Mac)
- `meta` / `win`: Windows key or Command key depending on platform

#### Key Syntax
- Modifiers and keys are joined with `+`
- Case insensitive for modifiers
- Examples: `ctrl+shift+p`, `cmd+k cmd+s` (chord), `alt+left`

#### Special Keys
- Arrow keys: `up`, `down`, `left`, `right`
- Function keys: `f1` through `f12`
- Special: `escape`, `enter`, `tab`, `space`, `backspace`, `delete`
- Navigation: `home`, `end`, `pageup`, `pagedown`
- Other: `insert`, `pause`, `capslock`, `numlock`, `scrolllock`

#### Platform-Specific Differences
- Mac: `cmd` is preferred over `ctrl` for most shortcuts
- Windows/Linux: `ctrl` is the primary modifier
- Use `meta` for Windows key on Windows/Linux, Command on Mac

## Command System

### Command Format
- Commands use dot notation: `workbench.action.files.save`
- Negation prefix `-` disables a command: `-workbench.action.quickOpen`
- Extension commands: `extension.commandName`

### Built-in Command Categories
- `workbench.action.*`: Workbench actions
- `editor.action.*`: Editor-specific actions
- `workbench.view.*`: View management
- `workbench.files.*`: File operations
- `debug.*`: Debugging commands
- `terminal.*`: Terminal commands

### Command Arguments
Commands can accept arguments as JSON:
```json
{
  "key": "ctrl+h",
  "command": "editor.action.startFindReplaceAction",
  "args": {
    "query": "hello",
    "replace": "world"
  }
}
```

## When Clause Context

### Expression Syntax
- Boolean operators: `&&`, `||`, `!`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Regex match: `=~` (e.g., `resourceExtname =~ /\\.(ts|js)/`)
- In operator: `in` (e.g., `resourceExtname in supportedExtensions`)

### Common Context Variables
- `editorFocus`: Editor has focus
- `editorTextFocus`: Text editor has focus
- `terminalFocus`: Terminal has focus
- `sideBarFocus`: Sidebar has focus
- `panelFocus`: Panel has focus
- `resourceExtname`: File extension of active file
- `resourceFilename`: Filename of active file
- `resourceScheme`: URI scheme (file, untitled, etc.)
- `editorReadonly`: Editor is read-only
- `editorHasSelection`: Text is selected
- `editorLangId`: Language ID of active editor
- `isWindows`, `isLinux`, `isMac`: Platform checks

### Expression Examples
```json
{
  "when": "editorTextFocus && !editorReadonly"
}
```
```json
{
  "when": "resourceExtname == .ts || resourceExtname == .tsx"
}
```

## File Formats

### User Keybindings (keybindings.json)
Standard JSON array format:
```json
[
  {
    "key": "ctrl+k ctrl+c",
    "command": "editor.action.addCommentLine",
    "when": "editorTextFocus && !editorReadonly"
  }
]
```

### Default Keybindings (JSONC)
JSON with Comments format, includes metadata:
```jsonc
[
  // Editor commands
  {
    "key": "ctrl+x",
    "command": "editor.action.clipboardCutAction",
    "when": "textInputFocus && !editorReadonly"
  },
  // Can include trailing commas
  {
    "key": "ctrl+c",
    "command": "editor.action.clipboardCopyAction",
  }
]
```

## Priority and Override Rules

### Resolution Order
1. User keybindings (highest priority)
2. Extension keybindings
3. Default keybindings (lowest priority)

### Conflict Resolution
- Later definitions override earlier ones in the same file
- User keybindings always win over defaults
- Use `-` prefix to remove default bindings

### Multi-Command Bindings
- Same key can trigger different commands with different `when` conditions
- More specific `when` clauses take precedence

### Keybinding Removal
To remove a default keybinding:
```json
{
  "key": "ctrl+k",
  "command": "-workbench.action.terminal.clear"
}
```

## Edge Cases and Gotchas

### Key Normalization
- Keys are case-insensitive for modifiers
- Regular keys preserve case (`a` vs `A` matters)
- Order of modifiers doesn't matter: `ctrl+shift+p` == `shift+ctrl+p`

### Chord Sequences
- Two-step keybindings: `"key": "ctrl+k ctrl+s"`
- Maximum of two chords in sequence
- Timeout between chords (default 5 seconds)

### Special Characters
- Some keys need escaping in JSON: `"key": "ctrl+\\"`
- Numeric keypad: `numpad0`-`numpad9`, `numpad_multiply`, etc.

### Context Inheritance
- Child views inherit parent context
- Panel-specific contexts override general ones

### Common Pitfalls
1. Using `ctrl` instead of `cmd` on Mac
2. Forgetting to disable default bindings when overriding
3. Not escaping special characters in when clauses
4. Overly broad when conditions causing conflicts
5. Case sensitivity in regular key names

## Platform Considerations

### Cross-Platform Best Practices
1. Use `cmd` for Mac, `ctrl` for Windows/Linux
2. Test keybindings on all target platforms
3. Consider keyboard layout differences
4. Provide platform-specific alternatives when needed

### Accessibility
- Avoid complex chord sequences
- Consider single-hand accessibility
- Don't override system-critical shortcuts
- Provide command palette alternatives

## Example Patterns

### Conditional Command Execution
```json
{
  "key": "tab",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && hasSnippetCompletions",
  "args": {
    "snippet": "console.log('$1')$0"
  }
}
```

### Platform-Specific Binding
```json
[
  {
    "key": "cmd+shift+p",
    "command": "workbench.action.showCommands",
    "when": "isMac"
  },
  {
    "key": "ctrl+shift+p",
    "command": "workbench.action.showCommands",
    "when": "!isMac"
  }
]
```

### Disabling and Replacing
```json
[
  {
    "key": "ctrl+b",
    "command": "-workbench.action.toggleSidebarVisibility"
  },
  {
    "key": "ctrl+b",
    "command": "workbench.action.togglePanel"
  }
]
```