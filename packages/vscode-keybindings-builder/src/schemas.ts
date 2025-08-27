import { z } from "zod";

export const VSCodeKeybindingSchema = z.object({
  key: z.string(),
  command: z.string(),
  when: z.string().optional(),
  args: z.unknown().optional(),
});

export const VSCodeKeybindingsSchema = z.array(VSCodeKeybindingSchema);

export const BuilderConfigSchema = z.object({
  dirname: z.string(),
  currentKeybindingPath: z.string().optional(),
  defaultKeybindingsFile: z.string().default("default-keybindings.jsonc"),
  outputFile: z.string().default("keybindings-generated.json"),
});
