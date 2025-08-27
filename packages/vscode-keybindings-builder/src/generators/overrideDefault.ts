import type { Command, VSCodeKeybinding } from "../types";

export const generateOverrideDefaultBindings = (
  key: string,
  defaultCommands: string[],
  customCommands: Command[]
): VSCodeKeybinding[] => {
  // Only disable defaults if there are defaults to override
  const disableBindings = defaultCommands.map((cmd) => ({
    key,
    command: `-${cmd}`,
  }));

  const customBindings = customCommands.map((cmd) => ({
    key,
    command: cmd.name,
    when: cmd.when,
    args: cmd.args,
  }));

  return [...disableBindings, ...customBindings];
};