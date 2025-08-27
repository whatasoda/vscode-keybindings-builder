import type { Command, VSCodeKeybinding } from "../types";

export const generatePreserveDefaultBindings = (
  key: string,
  customCommands: Command[]
): VSCodeKeybinding[] => {
  return customCommands.map((cmd) => ({
    key,
    command: cmd.name,
    when: cmd.when,
    args: cmd.args,
  }));
};