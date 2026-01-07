import * as FileSystem from "expo-file-system";

export const getSmartUri = (
  savedUri: string | number | undefined
): string | number | null => {
  if (!savedUri) return null;
  if (typeof savedUri === "number") {
    return savedUri;
  }

  if (savedUri.startsWith("http")) return savedUri;

  const fileName = savedUri.split("/").pop();

  if (!fileName) return null;

  return `${FileSystem.documentDirectory}${fileName}`;
};
