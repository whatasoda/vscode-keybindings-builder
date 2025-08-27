import type { z } from "zod";

export type KeyHandlingMode = "clearDefault" | "preserveDefault" | "overrideDefault";

export interface Command {
  name: string;
  when?: string;
  args?: unknown;
}

export interface RegisteredKey {
  key: string;
  mode: KeyHandlingMode;
  commands: Command[];
}

export interface VSCodeKeybinding {
  key: string;
  command: string;
  when?: string;
  args?: unknown;
}

export interface BuilderConfig {
  dirname: string;
  currentKeybindingPath?: string;
  defaultKeybindingsFile?: string;
  outputFile?: string;
}

export interface ConflictInfo {
  key: string;
  manualCommand: string;
  builderCommand: string;
}

export interface BuildSuccess {
  type: "BUILD_SUCCESS";
  keybindingsCount: number;
  preservedCount: number;
  outputPath: string;
  warnings: string[];
}