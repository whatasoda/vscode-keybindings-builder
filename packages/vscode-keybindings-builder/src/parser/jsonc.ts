import { err, ok, type Result } from "neverthrow";
import stripJsonComments from "strip-json-comments";
import type { BuilderError } from "../errors";

export function parseJSONC(content: string): Result<unknown, BuilderError> {
  try {
    // Strip comments from JSONC content
    let jsonString = stripJsonComments(content);

    // Handle trailing commas - remove them before parsing
    jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");

    // Parse the clean JSON
    const parsed = JSON.parse(jsonString);
    return ok(parsed);
  } catch (error) {
    return err({
      type: "JSONC_PARSE_ERROR",
      path: "inline",
      error,
    } as const);
  }
}

export function parseJSONCFile(content: string, path: string): Result<unknown, BuilderError> {
  try {
    // Strip comments from JSONC content
    let jsonString = stripJsonComments(content);

    // Handle trailing commas - remove them before parsing
    jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");

    // Parse the clean JSON
    const parsed = JSON.parse(jsonString);
    return ok(parsed);
  } catch (error) {
    return err({
      type: "JSONC_PARSE_ERROR",
      path,
      error,
    } as const);
  }
}
