// services/VoiceLibraryService.ts
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const VOICE_STORAGE_KEY = "@melodizr_voices";

export interface VoiceItem {
  id: string;
  title: string;
  uri: string;
  duration: number;
  createdAt: number;
  type: "humming" | "beatbox";
}

export const VoiceLibraryService = {
  saveVoice: async (
    tempUri: string,
    duration: number,
    type: "humming" | "beatbox" = "humming"
  ): Promise<VoiceItem> => {
    try {
      const id = Date.now().toString();
      const fileName = `voice_${id}.wav`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.moveAsync({
        from: tempUri,
        to: newPath,
      });

      const newVoice: VoiceItem = {
        id,
        title: `Recording ${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        uri: newPath,
        duration,
        createdAt: Date.now(),
        type,
      };

      const currentList = await VoiceLibraryService.getVoices();
      const newList = [newVoice, ...currentList];
      await AsyncStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(newList));

      console.log("Voice Saved:", newVoice);
      return newVoice;
    } catch (error) {
      console.error("Save Failed:", error);
      throw error;
    }
  },

  getVoices: async (): Promise<VoiceItem[]> => {
    try {
      const jsonValue = await AsyncStorage.getItem(VOICE_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      return [];
    }
  },

  deleteVoice: async (id: string): Promise<VoiceItem[]> => {
    const currentList = await VoiceLibraryService.getVoices();
    const target = currentList.find((item) => item.id === id);

    if (target) {
      await FileSystem.deleteAsync(target.uri, { idempotent: true }).catch(
        () => {}
      );
    }

    const newList = currentList.filter((item) => item.id !== id);
    await AsyncStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(newList));
    return newList;
  },
};
