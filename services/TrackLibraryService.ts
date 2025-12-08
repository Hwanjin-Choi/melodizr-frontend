import AsyncStorage from "@react-native-async-storage/async-storage";

export interface TrackItem {
  id: string;
  title: string;
  duration: string;
  uri?: string;
  originalVoiceId?: string;
  createdAt: number;
}

const TRACK_STORAGE_KEY = "@melodizr_tracks";

export const TrackLibraryService = {
  // 트랙 저장
  saveTrack: async (track: TrackItem): Promise<TrackItem[]> => {
    try {
      const currentList = await TrackLibraryService.getTracks();
      const newList = [track, ...currentList]; // 최신순 정렬
      await AsyncStorage.setItem(TRACK_STORAGE_KEY, JSON.stringify(newList));
      return newList;
    } catch (e) {
      console.error("Failed to save track", e);
      return [];
    }
  },

  // 트랙 목록 불러오기
  getTracks: async (): Promise<TrackItem[]> => {
    try {
      const jsonValue = await AsyncStorage.getItem(TRACK_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Failed to load tracks", e);
      return [];
    }
  },

  // 트랙 삭제 (필요시 사용)
  deleteTrack: async (id: string): Promise<TrackItem[]> => {
    try {
      const currentList = await TrackLibraryService.getTracks();
      const newList = currentList.filter((item) => item.id !== id);
      await AsyncStorage.setItem(TRACK_STORAGE_KEY, JSON.stringify(newList));
      return newList;
    } catch (e) {
      return [];
    }
  },
};
