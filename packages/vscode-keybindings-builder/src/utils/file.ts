import * as fs from "fs";
import { err, ok, type Result } from "neverthrow";
import type { BuilderError } from "../errors";

export function readFileSync(path: string): Result<string, BuilderError> {
  return (() => {
    try {
      if (!fs.existsSync(path)) {
        return err({ type: "FILE_NOT_FOUND", path } as const);
      }
      const content = fs.readFileSync(path, "utf-8");
      return ok(content);
    } catch (error) {
      return err({ type: "FILE_READ_ERROR", path, error } as const);
    }
  })();
}

export async function readFileAsync(path: string): Promise<Result<string, BuilderError>> {
  try {
    // Check existence first
    const exists = await fs.promises
      .access(path, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      return err({ type: "FILE_NOT_FOUND", path } as const);
    }

    // Read file - external library may throw
    const content = await fs.promises.readFile(path, "utf-8");
    return ok(content);
  } catch (error) {
    // Only catching external library errors
    return err({ type: "FILE_READ_ERROR", path, error } as const);
  }
}

export async function writeFileAsync(
  path: string,
  content: string,
): Promise<Result<void, BuilderError>> {
  try {
    // External library may throw
    await fs.promises.writeFile(path, content, "utf-8");
    return ok(undefined);
  } catch (error) {
    // Catch only external errors
    return err({ type: "FILE_WRITE_ERROR", path, error } as const);
  }
}
