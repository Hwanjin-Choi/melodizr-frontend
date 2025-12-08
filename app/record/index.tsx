import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Button, Text, YStack, H3, ScrollView } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecordHeader } from "@/features/record/components/RecordHeader";
import { TrackList, type Track } from "@/features/record/components/TrackList";
import { RecordBottomBar } from "@/features/record/components/RecordBottomBarProps";
import {
  RecordBottomSheet,
  RecordBottomSheetHandle,
} from "@/features/record/components/RecordBottomSheet";
import { VoiceList } from "@/features/record/components/VoiceList";
import { VoiceLibraryService, VoiceItem } from "@/services/VoiceLibraryService";
import { TrackLibraryService } from "@/services/TrackLibraryService";

import { ProjectPlayer } from "@/features/record/components/ProjectPlayer";

export default function RecordPage() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<RecordBottomSheetHandle>(null);
  const [isProjectTab, setIsProjectTab] = useState(true);
  const [voiceLibrary, setVoiceLibrary] = useState<VoiceItem[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);

  const loadVoices = async () => {
    const voices = await VoiceLibraryService.getVoices();
    setVoiceLibrary(voices);
  };

  const loadTracks = async () => {
    const savedTracks = await TrackLibraryService.getTracks();
    setTracks(savedTracks);
  };

  useEffect(() => {
    loadVoices();
    loadTracks();
  }, []);

  const handleConversionComplete = async (
    newVoice: VoiceItem,
    newTrack: Track
  ) => {
    await loadVoices();
    await loadTracks();

    setIsProjectTab(true);
    bottomSheetRef.current?.close();
  };

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleDeleteTrack = async (track: Track) => {
    await TrackLibraryService.deleteTrack(track.id);
    await loadTracks();
  };

  const handleConvertFromVoice = (voice: VoiceItem) => {
    bottomSheetRef.current?.openForConversion(voice);
  };

  const onRecordingFinished = async (uri: string, duration: number) => {
    console.log("Saving recording:", uri);
    await VoiceLibraryService.saveVoice(uri, duration, "humming");
    await loadVoices();
    bottomSheetRef.current?.close();
    setIsProjectTab(false);
  };

  const handleToggleMute = (trackId: string) => {
    setTracks((prevTracks) =>
      prevTracks.map((track) =>
        track.id === trackId ? { ...track, isMuted: !track.isMuted } : track
      )
    );
  };

  const activeTracks = tracks.filter((t) => !t.isMuted);

  return (
    <YStack flex={1} bg="$background" paddingTop={insets.top}>
      <RecordHeader isProject={isProjectTab} onTabChange={setIsProjectTab} />

      {isProjectTab ? (
        <YStack flex={1}>
          {tracks.length > 0 && (
            <YStack px="$4" pb="$4">
              <ProjectPlayer layers={activeTracks} />
            </YStack>
          )}

          {/* 기존 트랙 리스트 */}
          <TrackList
            tracks={tracks}
            onStartRecording={handleOpenSheet}
            onDeleteTrack={handleDeleteTrack}
            onToggleMute={handleToggleMute}
          />
        </YStack>
      ) : (
        <VoiceList
          voices={voiceLibrary}
          onDeleteVoice={loadVoices}
          onConvertVoice={handleConvertFromVoice}
        />
      )}

      <RecordBottomBar visible={true} onOpenSheet={handleOpenSheet} />

      <RecordBottomSheet
        ref={bottomSheetRef}
        onConversionComplete={handleConversionComplete}
      />
    </YStack>
  );
}
