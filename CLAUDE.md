# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VSCode keybindings builder library that provides a programmatic API for generating VSCode keybindings configurations. The project uses a monorepo structure with workspaces managed by Bun.

## Development Environment

- **Runtime**: Bun (v1.2.19+)
- **Language**: TypeScript with strict mode enabled
- **Code Style**: Biome for formatting and linting

## Common Commands

```bash
# Install dependencies
bun install

# Run linting and formatting
bunx biome check packages/ example/

# Fix linting and formatting issues
bunx biome check --write packages/ example/

# Type checking
bunx tsc --noEmit

# Build the example
cd example && bun run build
```

## Project Structure

- **packages/vscode-keyboard-builder**: Main library package containing the builder API
- **example/**: Example usage of the keybindings builder
- **Workspace configuration**: Uses Bun workspaces with packages/* and example directories

## Code Architecture

The library provides a builder pattern API for constructing VSCode keybindings:

1. **Builder Creation**: `createBuilder()` initializes a builder instance with configuration
2. **Key Registration**: Chain methods like `.key()`, `.command()`, and `.register()` to define keybindings
3. **Build Output**: `.build()` generates the final keybindings configuration

Key builder methods:
- `.key(binding, mode)`: Define key combination and handling mode
- `.command(name, options)`: Attach VSCode command with optional conditions
- `.register()`: Finalize a keybinding entry
- `.build()`: Generate the output keybindings file

## Development Guidelines

- All TypeScript code must pass strict type checking
- Follow existing code patterns when implementing new features
- Use Biome for consistent formatting (2 spaces, semicolons required)
- The library should be framework-agnostic and work with pure TypeScript/JavaScript