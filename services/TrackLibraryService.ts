import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PlaybackSettings {
  type: "preset";
  originalBpm: number;
  targetBpm: number;
  targetBars: number;
  rate: number;
  loopCount: number;
}

export interface TrackItem {
  id: string;
  title: string;
  duration: string;
  uri?: string | number;
  originalVoiceId?: string;
  createdAt: number;
  playbackSettings?: PlaybackSettings;
}

export interface PresetSample {
  id: string;
  title: string;
  uri: number | string;
  originalBpm: number;
  originalBars: number;
}

const TRACK_STORAGE_KEY = "@melodizr_tracks";

export const TrackLibraryService = {
  // save track
  saveTrack: async (track: TrackItem): Promise<TrackItem[]> => {
    try {
      const currentList = await TrackLibraryService.getTracks();
      const newList = [track, ...currentList];
      await AsyncStorage.setItem(TRACK_STORAGE_KEY, JSON.stringify(newList));
      return newList;
    } catch (e) {
      console.error("Failed to save track", e);
      return [];
    }
  },

  // loading tracks
  getTracks: async (): Promise<TrackItem[]> => {
    try {
      const jsonValue = await AsyncStorage.getItem(TRACK_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Failed to load tracks", e);
      return [];
    }
  },

  // track delete
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
