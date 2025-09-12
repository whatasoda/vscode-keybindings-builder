import type { z } from "zod";
import type { ConflictInfo } from "./types";

export type BuilderError =
  | { type: "CONFIG_INVALID"; errors: z.ZodError }
  | { type: "FILE_NOT_FOUND"; path: string }
  | { type: "FILE_READ_ERROR"; path: string; error: unknown }
  | { type: "JSONC_PARSE_ERROR"; path: string; error: unknown }
  | { type: "JSON_PARSE_ERROR"; path: string; error: unknown }
  | { type: "DUPLICATE_KEY"; key: string; existingIndex: number }
  | { type: "CONFLICT_DETECTED"; conflicts: ConflictInfo[] }
  | { type: "INVALID_KEY_FORMAT"; key: string; reason: string }
  | { type: "INVALID_MODE"; mode: string }
  | { type: "NO_KEY_ACTIVE"; operation: string }
  | { type: "FILE_WRITE_ERROR"; path: string; error: unknown }
  | { type: "VALIDATION_ERROR"; details: z.ZodError };

export type ParseResult<T> =
  | { type: "PARSED"; data: T; warnings: string[] }
  | { type: "EMPTY"; warnings: string[] };
