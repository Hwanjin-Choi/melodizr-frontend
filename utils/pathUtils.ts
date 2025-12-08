import * as FileSystem from "expo-file-system";

export const getSmartUri = (savedUri: string | undefined): string | null => {
  if (!savedUri) return null;

  if (savedUri.startsWith("http")) return savedUri;

  const fileName = savedUri.split("/").pop();

  if (!fileName) return null;

  return `${FileSystem.documentDirectory}${fileName}`;
};
