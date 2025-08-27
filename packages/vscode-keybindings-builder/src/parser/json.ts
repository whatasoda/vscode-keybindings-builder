import { err, ok, type Result } from "neverthrow";
import type { BuilderError } from "../errors";

export function parseJSON(content: string, path: string): Result<unknown, BuilderError> {
  try {
    const parsed = JSON.parse(content);
    return ok(parsed);
  } catch (error) {
    return err({
      type: "JSON_PARSE_ERROR",
      path,
      error,
    } as const);
  }
}
