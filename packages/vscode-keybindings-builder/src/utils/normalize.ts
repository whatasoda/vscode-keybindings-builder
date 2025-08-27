export const normalizeKey = (key: string): string => {
  return key.toLowerCase().replace(/\s+/g, "").split("+").sort().join("+");
};

export const areKeysEquivalent = (key1: string, key2: string): boolean => {
  return normalizeKey(key1) === normalizeKey(key2);
};
