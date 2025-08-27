# Implementation Plan - VSCode Keyboard Builder

## Core Principles

### TDD Approach
Following t_wada's TDD methodology:
1. **Red** - Write a failing test that describes the desired behavior
2. **Green** - Write minimal code to make the test pass
3. **Refactor** - Improve the code while keeping tests green

### Type Safety
- **Zod Validation**: All external data (files, user input) validated with Zod schemas
- **No `any` types**: Every value must have explicit typing through validation
- **Runtime validation**: Ensure data integrity at runtime boundaries

### Error Handling
- **neverthrow**: Use `Result<T, E>` for all fallible operations
- **async-await**: Use async-await instead of excessive promise chaining
- **Limited throw**: Only for unreachable code paths (type narrowing) and external library errors
- **No throw in own code**: Return Result types instead of throwing errors
- **Discriminated unions**: Rich error types for precise error handling

### Functional Programming
- **No class-based state**: Use closures and factory functions for state management
- **Limited `let` scope**: Encapsulate mutable variables within closures
- **Pure functions**: Extract pure logic for better testability
- **Immutable data**: Prefer immutable operations and data structures
- **Classes only for**: DTOs, Error definitions, and pure method collections

## Pre-Implementation Research

### VSCode Keybinding Specification Research

Before starting implementation, research and document VSCode's keybinding system:

#### Research Tasks
1. **Key Format Specification**
   - Valid key combinations and modifiers
   - Platform-specific differences (Windows/Mac/Linux)
   - Special keys and their representations
   - Case sensitivity rules

2. **Command System**
   - Built-in command list
   - Command argument formats
   - Command naming conventions
   - Negation prefix (`-`) behavior

3. **When Clause Context**
   - Available context variables
   - Expression syntax
   - Operator precedence
   - Common patterns and best practices

4. **File Formats**
   - Default keybindings JSONC structure
   - User keybindings JSON structure
   - Comment handling in JSONC
   - Array vs object notation

5. **Priority and Override Rules**
   - How VSCode resolves conflicts
   - Priority between default and user bindings
   - Extension keybinding interaction
   - Multi-command bindings

#### Documentation Output
Create `docs/vscode-keybinding-spec.md` with:
- Key format grammar
- Command reference
- When clause reference
- Example patterns
- Edge cases and gotchas
- Platform-specific considerations

This research will inform:
- Validation rules
- Normalization logic
- Conflict detection
- Output format generation

## Test-Driven Development Cycles

### Cycle 1: Basic Builder Creation

#### Test Cases
```typescript
describe("createBuilder", () => {
  it("should create a builder instance with required config")
  it("should return error when dirname is not provided")
  it("should use default values for optional config fields")
  it("should validate config with Zod schema")
  it("should return validation error for invalid config")
})
```

#### Implementation Target
- `createBuilder` function returning `Result<KeybindingBuilder, BuilderError>`
- `BuilderConfig` interface with Zod validation
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

## Type Definitions and Error Handling

### Zod Schemas

```typescript
// schemas.ts
import { z } from 'zod';

// VSCode keybinding schema
export const VSCodeKeybindingSchema = z.object({
  key: z.string(),
  command: z.string(),
  when: z.string().optional(),
  args: z.unknown().optional(),
});

export const VSCodeKeybindingsSchema = z.array(VSCodeKeybindingSchema);

// Config schema
export const BuilderConfigSchema = z.object({
  dirname: z.string(),
  currentKeybindingPath: z.string().optional(),
  defaultKeybindingsFile: z.string().default('default-keybindings.jsonc'),
  outputFile: z.string().default('keybindings-generated.json'),
});
```

### Error Types (Discriminated Unions)

```typescript
// errors.ts
export type BuilderError =
  | { type: 'CONFIG_INVALID'; errors: z.ZodError }
  | { type: 'FILE_NOT_FOUND'; path: string }
  | { type: 'FILE_READ_ERROR'; path: string; error: unknown }
  | { type: 'JSONC_PARSE_ERROR'; path: string; error: unknown }
  | { type: 'JSON_PARSE_ERROR'; path: string; error: unknown }
  | { type: 'DUPLICATE_KEY'; key: string; existingIndex: number }
  | { type: 'CONFLICT_DETECTED'; conflicts: ConflictInfo[] }
  | { type: 'INVALID_KEY_FORMAT'; key: string; reason: string }
  | { type: 'INVALID_MODE'; mode: string }
  | { type: 'NO_KEY_ACTIVE'; operation: string }
  | { type: 'FILE_WRITE_ERROR'; path: string; error: unknown }
  | { type: 'VALIDATION_ERROR'; details: z.ZodError };

export type ConflictInfo = {
  key: string;
  manualCommand: string;
  builderCommand: string;
};

// Success types for discriminated returns
export type ParseResult<T> =
  | { type: 'PARSED'; data: T; warnings: string[] }
  | { type: 'EMPTY'; warnings: string[] };

export type BuildSuccess = {
  type: 'BUILD_SUCCESS';
  keybindingsCount: number;
  preservedCount: number;
  outputPath: string;
  warnings: string[];
};
```

### Result Type Patterns

```typescript
// Example of proper Result usage without fromPromise
import { Result, ok, err } from 'neverthrow';
import * as fs from 'fs';

function readFileSync(path: string): Result<string, BuilderError> {
  // Use IIFE to handle try-catch locally
  return (() => {
    try {
      if (!fs.existsSync(path)) {
        return err({ type: 'FILE_NOT_FOUND', path } as const);
      }
      const content = fs.readFileSync(path, 'utf-8');
      return ok(content);
    } catch (error) {
      return err({ type: 'FILE_READ_ERROR', path, error } as const);
    }
  })();
}

// Parsing with validation
function parseKeybindings(
  content: string,
  path: string
): Result<ParseResult<z.infer<typeof VSCodeKeybindingsSchema>>, BuilderError> {
  return parseJSON(content, path).andThen((parsed) => {
    const validated = VSCodeKeybindingsSchema.safeParse(parsed);
    if (!validated.success) {
      return err({ type: 'VALIDATION_ERROR', details: validated.error } as const);
    }
    return ok({
      type: 'PARSED',
      data: validated.data,
      warnings: [],
    } as const);
  });
}

// Using async-await instead of chaining
async function loadAndValidateKeybindings(
  path: string
): Promise<Result<z.infer<typeof VSCodeKeybindingsSchema>, BuilderError>> {
  // Read file
  const contentResult = await readFileAsync(path);
  if (contentResult.isErr()) {
    return err(contentResult.error);
  }
  
  // Parse JSONC
  const parseResult = parseJSONC(contentResult.value);
  if (parseResult.isErr()) {
    return err({ type: 'JSONC_PARSE_ERROR', path, error: parseResult.error } as const);
  }
  
  // Validate with Zod
  const validation = VSCodeKeybindingsSchema.safeParse(parseResult.value);
  if (!validation.success) {
    return err({ type: 'VALIDATION_ERROR', details: validation.error } as const);
  }
  
  return ok(validation.data);
}

// File operations with proper async-await
async function readFileAsync(path: string): Promise<Result<string, BuilderError>> {
  try {
    // Check existence first
    const exists = await fs.promises.access(path, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
      
    if (!exists) {
      return err({ type: 'FILE_NOT_FOUND', path } as const);
    }
    
    // Read file - external library may throw
    const content = await fs.promises.readFile(path, 'utf-8');
    return ok(content);
  } catch (error) {
    // Only catching external library errors
    return err({ type: 'FILE_READ_ERROR', path, error } as const);
  }
}

// Builder using closure-based state management
export function createKeyboardBuilder(config: BuilderConfig) {
  // Private state encapsulated in closure
  let currentKey: string | null = null;
  let currentMode: KeyHandlingMode | null = null;
  let currentCommands: Command[] = [];
  const registeredKeys = new Map<string, RegisteredKey>();

  // Pure function for validation
  const validateAndNormalizeKey = (key: string): Result<string, BuilderError> => {
    const validation = validateKeyFormat(key);
    if (validation.isErr()) {
      return err(validation.error);
    }
    return ok(normalizeKey(key));
  };

  // Builder API with fluent interface
  const builder = {
    key(combination: string, mode: KeyHandlingMode): Result<typeof builder, BuilderError> {
      const normalized = validateAndNormalizeKey(combination);
      if (normalized.isErr()) {
        return err(normalized.error);
      }
      
      currentKey = combination;
      currentMode = mode;
      currentCommands = [];
      return ok(builder);
    },

    command(name: string, options?: { when?: string }): Result<typeof builder, BuilderError> {
      if (!currentKey) {
        return err({ type: 'NO_KEY_ACTIVE', operation: 'command' } as const);
      }

      currentCommands.push({ name, ...options });
      return ok(builder);
    },

    register(): Result<typeof builder, BuilderError> {
      if (!currentKey || !currentMode) {
        return err({ type: 'NO_KEY_ACTIVE', operation: 'register' } as const);
      }

      const normalized = normalizeKey(currentKey);
      if (registeredKeys.has(normalized)) {
        return err({ 
          type: 'DUPLICATE_KEY', 
          key: currentKey,
          existingIndex: Array.from(registeredKeys.keys()).indexOf(normalized)
        } as const);
      }

      registeredKeys.set(normalized, {
        key: currentKey,
        mode: currentMode,
        commands: [...currentCommands],
      });

      // Clear current state
      currentKey = null;
      currentMode = null;
      currentCommands = [];
      return ok(builder);
    },

    // Expose read-only view of state for build
    getRegisteredKeys: () => new Map(registeredKeys),
    getConfig: () => ({ ...config }),
  };

  return builder;
}
```

### Advanced Error Handling Patterns

```typescript
// Handling multiple error types with pattern matching
function handleBuilderError(error: BuilderError): string {
  switch (error.type) {
    case 'CONFIG_INVALID':
      return `Invalid configuration: ${error.errors.message}`;
    case 'FILE_NOT_FOUND':
      return `File not found: ${error.path}`;
    case 'CONFLICT_DETECTED':
      const conflicts = error.conflicts
        .map(c => `  - ${c.key}: "${c.manualCommand}" vs "${c.builderCommand}"`)
        .join('\n');
      return `Conflicts detected:\n${conflicts}`;
    case 'DUPLICATE_KEY':
      return `Duplicate key registration: ${error.key}`;
    default:
      return 'Unknown error occurred';
  }
}

// Async operations with async-await
async function writeFileAsync(
  path: string, 
  content: string
): Promise<Result<void, BuilderError>> {
  try {
    // External library may throw
    await fs.promises.writeFile(path, content, 'utf-8');
    return ok(undefined);
  } catch (error) {
    // Catch only external errors
    return err({ type: 'FILE_WRITE_ERROR', path, error } as const);
  }
}

// Type narrowing with throw for unreachable code
function processKeybinding(
  kb: RegisteredKey | undefined,
  config: BuilderConfig
): Result<ProcessedBinding, BuilderError> {
  if (!kb) {
    return err({ type: 'INVALID_KEY', key: 'undefined' } as const);
  }
  
  const mode = kb.mode;
  
  switch (mode) {
    case 'clearDefault':
      return processClearDefault(kb, config);
    case 'preserveDefault':
      return processPreserveDefault(kb, config);
    case 'overrideDefault':
      return processOverrideDefault(kb, config);
    default:
      // Type system ensures this is unreachable
      // OK to throw here for type narrowing
      const _exhaustive: never = mode;
      throw new Error(`Unreachable: ${_exhaustive}`);
  }
}

// Complex operation with async-await
async function buildKeybindings(
  builder: ReturnType<typeof createKeyboardBuilder>
): Promise<Result<BuildSuccess, BuilderError>> {
  const config = builder.getConfig();
  const registeredKeys = builder.getRegisteredKeys();
  
  // Load default keybindings
  const defaultResult = await loadDefaultKeybindings(config.defaultKeybindingsFile);
  if (defaultResult.isErr()) {
    return err(defaultResult.error);
  }
  
  // Load current keybindings if provided
  let currentKeybindings: VSCodeKeybinding[] = [];
  if (config.currentKeybindingPath) {
    const currentResult = await loadCurrentKeybindings(config.currentKeybindingPath);
    if (currentResult.isErr()) {
      return err(currentResult.error);
    }
    currentKeybindings = currentResult.value;
  }
  
  // Check for conflicts (pure function)
  const conflicts = detectConflicts(registeredKeys, currentKeybindings);
  if (conflicts.length > 0) {
    return err({ type: 'CONFLICT_DETECTED', conflicts } as const);
  }
  
  // Generate warnings for preserved keybindings
  const warnings = generatePreservationWarnings(registeredKeys, currentKeybindings);
  
  // Build final keybindings array (pure function)
  const keybindings = buildKeybindingsArray(
    registeredKeys,
    defaultResult.value,
    currentKeybindings
  );
  
  // Write output file
  const writeResult = await writeFileAsync(
    config.outputFile,
    JSON.stringify(keybindings, null, 2)
  );
  
  if (writeResult.isErr()) {
    return err(writeResult.error);
  }
  
  return ok({
    type: 'BUILD_SUCCESS',
    keybindingsCount: registeredKeys.size,
    preservedCount: currentKeybindings.length - conflicts.length,
    outputPath: config.outputFile,
    warnings,
  } as const);
}
```

### Pure Functions and Testing

```typescript
// Pure functions extracted for easy testing
// normalize.ts - Pure key normalization logic
export const normalizeKey = (key: string): string => {
  return key
    .toLowerCase()
    .replace(/\s+/g, '')
    .split('+')
    .sort()
    .join('+');
};

export const areKeysEquivalent = (key1: string, key2: string): boolean => {
  return normalizeKey(key1) === normalizeKey(key2);
};

// validators/key.ts - Pure validation functions
export const validateKeyFormat = (key: string): Result<void, BuilderError> => {
  const parts = key.split('+');
  
  if (parts.length === 0 || parts.some(p => p.trim() === '')) {
    return err({ 
      type: 'INVALID_KEY_FORMAT', 
      key, 
      reason: 'Key parts cannot be empty' 
    } as const);
  }

  const validModifiers = ['cmd', 'ctrl', 'alt', 'shift', 'meta'];
  const invalidModifier = parts.find(p => 
    validModifiers.includes(p.toLowerCase()) === false && 
    p.length > 2
  );

  if (invalidModifier) {
    return err({ 
      type: 'INVALID_KEY_FORMAT', 
      key, 
      reason: `Invalid modifier: ${invalidModifier}` 
    } as const);
  }

  return ok(undefined);
};

// generators/clearDefault.ts - Pure keybinding generation
export const generateClearDefaultBindings = (
  key: string,
  defaultCommands: string[],
  customCommands: Command[]
): VSCodeKeybinding[] => {
  const disableBindings = defaultCommands.map(cmd => ({
    key,
    command: `-${cmd}`,
  }));

  const customBindings = customCommands.map(cmd => ({
    key,
    command: cmd.name,
    when: cmd.when,
  }));

  return [...disableBindings, ...customBindings];
};

// conflict.ts - Pure conflict detection
export const detectConflicts = (
  builderKeys: Map<string, RegisteredKey>,
  manualKeybindings: VSCodeKeybinding[]
): ConflictInfo[] => {
  const conflicts: ConflictInfo[] = [];
  
  for (const manual of manualKeybindings) {
    const normalizedManualKey = normalizeKey(manual.key);
    
    for (const [normalizedBuilderKey, registered] of builderKeys) {
      if (normalizedManualKey === normalizedBuilderKey) {
        conflicts.push({
          key: manual.key,
          manualCommand: manual.command,
          builderCommand: registered.commands[0]?.name || '',
        });
      }
    }
  }

  return conflicts;
};

// Test examples
describe('Pure function tests', () => {
  describe('normalizeKey', () => {
    it('should normalize key combinations consistently', () => {
      expect(normalizeKey('Cmd+Shift+P')).toBe('cmd+p+shift');
      expect(normalizeKey('shift+cmd+p')).toBe('cmd+p+shift');
    });
  });

  describe('validateKeyFormat', () => {
    it('should accept valid key formats', () => {
      const result = validateKeyFormat('cmd+shift+p');
      expect(result.isOk()).toBe(true);
    });

    it('should reject invalid formats', () => {
      const result = validateKeyFormat('cmd++p');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_KEY_FORMAT');
      }
    });
  });

  describe('generateClearDefaultBindings', () => {
    it('should generate disable commands followed by custom commands', () => {
      const result = generateClearDefaultBindings(
        'cmd+p',
        ['workbench.action.quickOpen'],
        [{ name: 'myCommand', when: 'editorFocus' }]
      );
      
      expect(result).toEqual([
        { key: 'cmd+p', command: '-workbench.action.quickOpen' },
        { key: 'cmd+p', command: 'myCommand', when: 'editorFocus' },
      ]);
    });
  });
});
```

## File Structure

```
packages/vscode-keyboard-builder/
├── docs/
│   └── vscode-keybinding-spec.md  # Research documentation
├── src/
│   ├── index.ts                    # Main entry point with createBuilder
│   ├── index.test.ts               # Tests for main entry point
│   ├── builder.ts                  # Builder factory function  
│   ├── builder.test.ts             # Builder tests
│   ├── types.ts                    # TypeScript interfaces (DTOs only)
│   ├── schemas.ts                  # Zod schemas for validation
│   ├── schemas.test.ts             # Schema validation tests
│   ├── errors.ts                   # Error class definitions
│   ├── parser/
│   │   ├── jsonc.ts               # JSONC parser with Zod validation
│   │   ├── jsonc.test.ts          # JSONC parser tests
│   │   ├── json.ts                # JSON parser with Zod validation
│   │   └── json.test.ts           # JSON parser tests
│   ├── validators/
│   │   ├── key.ts                 # Pure key validation functions
│   │   ├── key.test.ts            # Key validation tests
│   │   ├── conflict.ts            # Pure conflict detection functions
│   │   └── conflict.test.ts       # Conflict detection tests
│   ├── generators/
│   │   ├── clearDefault.ts        # Pure binding generation for clear mode
│   │   ├── clearDefault.test.ts   # Clear mode generator tests
│   │   ├── preserveDefault.ts     # Pure binding generation for preserve mode
│   │   ├── preserveDefault.test.ts # Preserve mode generator tests
│   │   ├── overrideDefault.ts     # Pure binding generation for override mode
│   │   └── overrideDefault.test.ts # Override mode generator tests
│   ├── utils/
│   │   ├── file.ts                # File I/O operations (side effects)
│   │   ├── file.test.ts           # File I/O tests with mocks
│   │   ├── normalize.ts           # Pure normalization functions
│   │   └── normalize.test.ts      # Normalization tests
│   └── integration/
│       ├── integration.test.ts    # End-to-end integration tests
│       └── fixtures/
│           ├── default-keybindings.jsonc
│           ├── current-keybindings.json
│           └── expected-outputs/
└── package.json
```

## Testing Strategy

### Unit Tests
- Each module tested in isolation
- Colocated with implementation files (`.test.ts`)
- Mock file system operations
- Mock dependencies between modules
- Focus on single responsibility

### Integration Tests
- Test complete workflows
- Located in `src/integration/`
- Use real file system with temp directories
- Verify actual output files
- Test error scenarios end-to-end

### Test Organization
- **Colocated tests**: Unit tests next to implementation
- **Test naming**: `{module}.test.ts` for each `{module}.ts`
- **Shared fixtures**: In `integration/fixtures/`
- **Test utilities**: Create `test-utils.ts` in each directory as needed

### Test Utilities
- Factory functions for test data
- Assertion helpers for keybinding comparison
- File system test helpers
- Mock builders for common scenarios

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

0. **VSCode Specification Research** - Document keybinding system behavior
1. **Core Types** (Cycle 1)
2. **Fluent API** (Cycles 2-4)
3. **File Parsing** (Cycle 5)
4. **Conflict Detection** (Cycles 6-7)
5. **Build Logic** (Cycles 8-10)
6. **Output Generation** (Cycle 11)
7. **Integration** (Cycle 12)

## Dependencies

```json
{
  "dependencies": {
    "zod": "^3.x",
    "neverthrow": "^6.x",
    "strip-json-comments": "^5.x"
  },
  "devDependencies": {
    "vitest": "^1.x",
    "@types/node": "^20.x"
  }
}
```

## Architecture Patterns

### Separation of Concerns

```typescript
// Side effects isolated in specific modules
// utils/file.ts - All file I/O operations
export const readFile = (path: string): Result<string, BuilderError> => {
  return (() => {
    try {
      const content = fs.readFileSync(path, 'utf-8');
      return ok(content);
    } catch (error) {
      return err({ type: 'FILE_READ_ERROR', path, error } as const);
    }
  })();
};

// Pure business logic
// generators/build.ts - Pure build logic
export const buildKeybindingsArray = (
  registeredKeys: Map<string, RegisteredKey>,
  defaultKeybindings: VSCodeKeybinding[],
  manualKeybindings: VSCodeKeybinding[],
  mode: 'clearDefault' | 'preserveDefault' | 'overrideDefault'
): VSCodeKeybinding[] => {
  // Pure transformation logic
  const result: VSCodeKeybinding[] = [];
  
  // Process each registered key based on mode
  for (const [_, registered] of registeredKeys) {
    const defaultCommands = defaultKeybindings
      .filter(kb => normalizeKey(kb.key) === normalizeKey(registered.key))
      .map(kb => kb.command);
    
    switch (registered.mode) {
      case 'clearDefault':
        result.push(...generateClearDefaultBindings(
          registered.key, 
          defaultCommands, 
          registered.commands
        ));
        break;
      case 'preserveDefault':
        result.push(...generatePreserveDefaultBindings(
          registered.key,
          registered.commands
        ));
        break;
      case 'overrideDefault':
        result.push(...generateOverrideDefaultBindings(
          registered.key,
          defaultCommands,
          registered.commands
        ));
        break;
    }
  }
  
  // Add preserved manual keybindings
  const builderKeys = new Set(
    Array.from(registeredKeys.values()).map(r => normalizeKey(r.key))
  );
  
  const preserved = manualKeybindings.filter(
    kb => !builderKeys.has(normalizeKey(kb.key))
  );
  
  return [...result, ...preserved];
};

// Composition of pure and impure functions
// build.ts - Orchestrator
export const build = async (
  builder: ReturnType<typeof createKeyboardBuilder>
): Promise<Result<BuildSuccess, BuilderError>> => {
  const config = builder.getConfig();
  const registeredKeys = builder.getRegisteredKeys();
  
  // Load files (side effects)
  const defaultResult = await loadDefaultKeybindings(config.defaultKeybindingsFile);
  if (defaultResult.isErr()) return err(defaultResult.error);
  
  const manualResult = config.currentKeybindingPath 
    ? await loadCurrentKeybindings(config.currentKeybindingPath)
    : ok([]);
  if (manualResult.isErr()) return err(manualResult.error);
  
  // Check conflicts (pure logic)
  const conflicts = detectConflicts(registeredKeys, manualResult.value);
  if (conflicts.length > 0) {
    return err({ type: 'CONFLICT_DETECTED', conflicts } as const);
  }
  
  // Build keybindings (pure logic)
  const keybindings = buildKeybindingsArray(
    registeredKeys,
    defaultResult.value,
    manualResult.value,
    'clearDefault'
  );
  
  // Write output (side effect)
  const writeResult = await writeFile(config.outputFile, JSON.stringify(keybindings, null, 2));
  if (writeResult.isErr()) return err(writeResult.error);
  
  return ok({
    type: 'BUILD_SUCCESS',
    keybindingsCount: registeredKeys.size,
    preservedCount: manualResult.value.length - conflicts.length,
    outputPath: config.outputFile,
    warnings: generateWarnings(manualResult.value, registeredKeys),
  } as const);
};
```

## Error Handling Guidelines

### When to use `throw`
1. **Unreachable code paths** - For exhaustive type checking with `never`
   ```typescript
   const _exhaustive: never = value;
   throw new Error(`Unreachable: ${_exhaustive}`);
   ```

2. **External library errors** - When calling external APIs that may throw
   ```typescript
   try {
     await fs.promises.readFile(path);  // External library
   } catch (error) {
     return err({ type: 'FILE_READ_ERROR', path, error } as const);
   }
   ```

### When NOT to use `throw`
- In your own business logic
- For expected error conditions
- For validation failures
- Instead, always return `Result<T, E>`

### Async-Await Best Practices
- Use `async-await` for readability
- Avoid excessive `.then()` chaining
- Early return pattern for error handling
- Keep try-catch blocks minimal and focused on external calls

## Notes

- Use Vitest for testing framework
- Use `strip-json-comments` for JSONC parsing
- Implement proper error messages with actionable guidance
- Add debug logging for troubleshooting
- Consider future extensibility in design
- All external data must be validated with Zod schemas
- Never use `any` type - always validate to proper types
- Use Result types consistently throughout the codebase
- Use async-await over promise chaining
- Limit throw to unreachable code and external library errors
- Use closures to limit mutable variable scope
- Extract pure functions for better testability
- Separate side effects from business logic
- Use factory functions instead of classes for state management