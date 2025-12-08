import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Button, Text, YStack, H3 } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecordHeader } from "@/features/record/components/RecordHeader";
import { TrackList, type Track } from "@/features/record/components/TrackList";
import { RecordBottomBar } from "@/features/record/components/RecordBottomBarProps";
import { RecordBottomSheet } from "@/features/record/components/RecordBottomSheet";
import { VoiceList } from "@/features/record/components/VoiceList";
import { VoiceLibraryService, VoiceItem } from "@/services/VoiceLibraryService";
import { TrackLibraryService } from "@/services/TrackLibraryService";

export default function RecordPage() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
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

  /* const [tracks, setTracks] = useState<Track[]>([
    {
      id: "1",
      title: "Main Vocals",
      duration: "03:45",
    },
    {
      id: "2",
      title: "Acoustic Guitar",
      duration: "03:42",
    },
    {
      id: "3",
      title: "Backing Harmony",
      duration: "03:45",
    },
    {
      id: "4",
      title: "Piano Intro",
      duration: "00:30",
    },
  ]);
 */

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const onRecordingFinished = async (uri: string, duration: number) => {
    console.log("Saving recording:", uri);

    // 1. 서비스 통해 파일 저장
    await VoiceLibraryService.saveVoice(uri, duration, "humming");

    // 2. 목록 갱신
    await loadVoices();

    // 3. 시트 닫기 및 탭 전환
    bottomSheetRef.current?.close();
    setIsProjectTab(false);
  };
  return (
    <YStack flex={1} bg="$background" paddingTop={insets.top}>
      <RecordHeader isProject={isProjectTab} onTabChange={setIsProjectTab} />

      {isProjectTab ? (
        <TrackList tracks={tracks} onStartRecording={handleOpenSheet} />
      ) : (
        <VoiceList
          voices={voiceLibrary}
          onDeleteVoice={loadVoices}
          onConvertVoice={() => {
            console.log("Voice list convert implementation needed");
          }}
        />
      )}

      <RecordBottomBar
        visible={tracks.length > 0}
        onOpenSheet={handleOpenSheet}
      />

      <RecordBottomSheet
        ref={bottomSheetRef}
        onConversionComplete={handleConversionComplete}
      />
    </YStack>
  );
}
