# Implementation Plan - VSCode Keyboard Builder

## TDD Approach

Following t_wada's TDD methodology:
1. **Red** - Write a failing test that describes the desired behavior
2. **Green** - Write minimal code to make the test pass
3. **Refactor** - Improve the code while keeping tests green

## Test-Driven Development Cycles

### Cycle 1: Basic Builder Creation

#### Test Cases
```typescript
describe("createBuilder", () => {
  it("should create a builder instance with required config")
  it("should throw error when dirname is not provided")
  it("should use default values for optional config fields")
})
```

#### Implementation Target
- `createBuilder` function
- `BuilderConfig` interface
- Basic `KeybindingBuilder` class structure

---

### Cycle 2: Fluent API - Key Registration

#### Test Cases
```typescript
describe("KeybindingBuilder.key()", () => {
  it("should accept a key combination and mode")
  it("should return builder instance for chaining")
  it("should throw error for invalid key combination format")
  it("should accept 'clearDefault', 'preserveDefault', and 'overrideDefault' modes")
  it("should throw error for invalid mode")
})
```

#### Implementation Target
- `key()` method
- Key combination validation
- `KeyHandlingMode` enum

---

### Cycle 3: Fluent API - Command Addition

#### Test Cases
```typescript
describe("KeybindingBuilder.command()", () => {
  it("should add a command to the current key")
  it("should accept optional 'when' condition")
  it("should return builder instance for chaining")
  it("should throw error if called without calling key() first")
  it("should allow multiple commands for the same key")
})
```

#### Implementation Target
- `command()` method
- `Command` interface
- Command storage mechanism

---

### Cycle 4: Registration and Duplicate Detection

#### Test Cases
```typescript
describe("KeybindingBuilder.register()", () => {
  it("should finalize a keybinding entry")
  it("should clear current key state after registration")
  it("should detect duplicate key registrations within builder")
  it("should throw error when registering the same key twice")
  it("should return builder instance for chaining")
})
```

#### Implementation Target
- `register()` method
- Duplicate key detection logic
- Internal keybinding storage

---

### Cycle 5: JSONC Parser for Default Keybindings

#### Test Cases
```typescript
describe("parseDefaultKeybindings", () => {
  it("should parse JSONC file with comments")
  it("should extract all default keybindings")
  it("should handle single-line comments")
  it("should handle multi-line comments")
  it("should handle trailing commas")
  it("should throw error for invalid JSONC format")
})
```

#### Implementation Target
- JSONC parser utility
- Default keybindings data structure
- Error handling for malformed files

---

### Cycle 6: Current Keybindings Loading and Conflict Detection

#### Test Cases
```typescript
describe("loadCurrentKeybindings", () => {
  it("should load existing keybindings from JSON file")
  it("should return empty array if file doesn't exist")
  it("should parse standard JSON format")
})

describe("detectConflicts", () => {
  it("should detect conflicts between builder and manual keybindings")
  it("should return list of conflicting keys")
  it("should ignore non-conflicting manual keybindings")
  it("should handle case-insensitive key comparisons")
})
```

#### Implementation Target
- Current keybindings loader
- Conflict detection algorithm
- Key normalization for comparison

---

### Cycle 7: Manual Keybinding Preservation

#### Test Cases
```typescript
describe("preserveManualKeybindings", () => {
  it("should identify manual keybindings not in builder")
  it("should generate warnings for each preserved keybinding")
  it("should include preserved keybindings in output")
  it("should maintain original format of preserved keybindings")
})
```

#### Implementation Target
- Manual keybinding preservation logic
- Warning generation system
- Keybinding merging algorithm

---

### Cycle 8: Build Process - Clear Default Mode

#### Test Cases
```typescript
describe("build() with clearDefault mode", () => {
  it("should generate disable commands for default keybindings")
  it("should add custom commands after disable commands")
  it("should use '-' prefix for disable commands")
  it("should handle multiple default commands for same key")
})
```

#### Implementation Target
- Build logic for `clearDefault` mode
- Disable command generation
- Output formatting

---

### Cycle 9: Build Process - Preserve Default Mode

#### Test Cases
```typescript
describe("build() with preserveDefault mode", () => {
  it("should not generate disable commands")
  it("should only add custom commands")
  it("should work alongside existing default keybindings")
})
```

#### Implementation Target
- Build logic for `preserveDefault` mode
- Command merging logic

---

### Cycle 10: Build Process - Override Default Mode

#### Test Cases
```typescript
describe("build() with overrideDefault mode", () => {
  it("should generate disable commands for defaults")
  it("should replace with custom commands")
  it("should handle keys with no default bindings")
})
```

#### Implementation Target
- Build logic for `overrideDefault` mode
- Override command generation

---

### Cycle 11: File Output Generation

#### Test Cases
```typescript
describe("build() output generation", () => {
  it("should write JSON file to specified output path")
  it("should create properly formatted JSON array")
  it("should include all registered keybindings")
  it("should include preserved manual keybindings")
  it("should return BuildResult with statistics")
  it("should handle file system errors gracefully")
})
```

#### Implementation Target
- File writing logic
- JSON formatting
- `BuildResult` interface implementation
- Error handling for file operations

---

### Cycle 12: Integration Tests

#### Test Cases
```typescript
describe("End-to-end integration", () => {
  it("should handle complete workflow with default keybindings")
  it("should handle workflow with current keybindings")
  it("should fail on conflicts between builder and manual")
  it("should preserve non-conflicting manual keybindings")
  it("should generate correct output for mixed modes")
  it("should handle missing default keybindings file")
})
```

#### Implementation Target
- Full integration testing
- Error scenarios
- Edge cases

---

## File Structure

```
packages/vscode-keyboard-builder/
├── src/
│   ├── index.ts                 # Main entry point with createBuilder
│   ├── builder.ts               # KeybindingBuilder class
│   ├── types.ts                 # All TypeScript interfaces and types
│   ├── parser/
│   │   ├── jsonc.ts            # JSONC parser for default keybindings
│   │   └── json.ts             # JSON parser for current keybindings
│   ├── validators/
│   │   ├── key.ts              # Key combination validation
│   │   └── conflict.ts         # Conflict detection logic
│   ├── generators/
│   │   ├── clearDefault.ts     # Clear default mode generator
│   │   ├── preserveDefault.ts  # Preserve default mode generator
│   │   └── overrideDefault.ts  # Override default mode generator
│   └── utils/
│       ├── file.ts             # File I/O utilities
│       └── normalize.ts        # Key normalization utilities
├── tests/
│   ├── builder.test.ts
│   ├── parser.test.ts
│   ├── validators.test.ts
│   ├── generators.test.ts
│   ├── integration.test.ts
│   └── fixtures/
│       ├── default-keybindings.jsonc
│       ├── current-keybindings.json
│       └── expected-outputs/
└── package.json
```

## Testing Strategy

### Unit Tests
- Each module tested in isolation
- Mock file system operations
- Mock dependencies between modules
- Focus on single responsibility

### Integration Tests
- Test complete workflows
- Use real file system with temp directories
- Verify actual output files
- Test error scenarios end-to-end

### Test Utilities
- Factory functions for test data
- Assertion helpers for keybinding comparison
- File system test helpers

## Development Workflow

1. **Start with the simplest test case**
   - Basic builder creation
   - Add complexity incrementally

2. **One feature at a time**
   - Complete each cycle before moving to next
   - Keep all tests green during refactoring

3. **Refactor opportunities**
   - After each green test
   - When patterns emerge
   - Before adding new features

4. **Documentation**
   - Update types as implemented
   - Add JSDoc comments
   - Update README with examples

## Success Criteria

- [ ] All test cases pass
- [ ] 100% test coverage for core logic
- [ ] No TypeScript errors with strict mode
- [ ] Clean lint report (Biome)
- [ ] Example project builds successfully
- [ ] Generated output works in VSCode

## Implementation Order

1. **Core Types** (Cycle 1)
2. **Fluent API** (Cycles 2-4)
3. **File Parsing** (Cycle 5)
4. **Conflict Detection** (Cycles 6-7)
5. **Build Logic** (Cycles 8-10)
6. **Output Generation** (Cycle 11)
7. **Integration** (Cycle 12)

## Notes

- Use Vitest for testing framework
- Consider using `strip-json-comments` for JSONC parsing
- Implement proper error messages with actionable guidance
- Add debug logging for troubleshooting
- Consider future extensibility in design