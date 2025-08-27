import { Result, ok, err } from "neverthrow";
import type { BuilderError } from "../errors";

export const validateKeyFormat = (key: string): Result<void, BuilderError> => {
  const parts = key.split("+");

  if (parts.length === 0 || parts.some((p) => p.trim() === "")) {
    return err({
      type: "INVALID_KEY_FORMAT",
      key,
      reason: "Key parts cannot be empty",
    } as const);
  }

  const validModifiers = ["cmd", "ctrl", "alt", "shift", "meta", "win", "option"];
  const specialKeys = [
    "escape", "enter", "tab", "space", "backspace", "delete",
    "up", "down", "left", "right",
    "home", "end", "pageup", "pagedown",
    "insert", "pause", "capslock", "numlock", "scrolllock",
  ];
  const functionKeys = Array.from({ length: 12 }, (_, i) => `f${i + 1}`);

  // Check each part
  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    
    // Check if it's a valid modifier, special key, function key, or single character
    const isModifier = validModifiers.includes(lowerPart);
    const isSpecialKey = specialKeys.includes(lowerPart);
    const isFunctionKey = functionKeys.includes(lowerPart);
    const isSingleChar = part.length === 1;
    const isNumpadKey = lowerPart.startsWith("numpad");
    
    if (!isModifier && !isSpecialKey && !isFunctionKey && !isSingleChar && !isNumpadKey) {
      // Check for chord notation (e.g., "ctrl+k ctrl+s")
      if (part.includes(" ") && key.includes(" ")) {
        // This might be a chord, validate it recursively
        const chords = key.split(" ");
        for (const chord of chords) {
          const chordValidation = validateKeyFormat(chord);
          if (chordValidation.isErr()) {
            return chordValidation;
          }
        }
        return ok(undefined);
      }
      
      return err({
        type: "INVALID_KEY_FORMAT",
        key,
        reason: `Invalid key part: ${part}`,
      } as const);
    }
  }

  return ok(undefined);
};