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

export default function RecordPage() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isProjectTab, setIsProjectTab] = useState(true);
  const [voiceLibrary, setVoiceLibrary] = useState<VoiceItem[]>([]);

  const loadVoices = async () => {
    const voices = await VoiceLibraryService.getVoices();
    setVoiceLibrary(voices);
  };

  useEffect(() => {
    loadVoices();
  }, []);

  /*  const [tracks, setTracks] = useState([]); // empty array state */

  const [tracks, setTracks] = useState<Track[]>([
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
    setIsProjectTab(false); // Voice 탭으로 이동하여 결과 보여줌
  };
  return (
    <YStack flex={1} bg="$background" paddingTop={insets.top}>
      {/* 1. Header */}
      <RecordHeader isProject={isProjectTab} onTabChange={setIsProjectTab} />

      {isProjectTab ? (
        // 프로젝트 탭 (기존 트랙 리스트)
        <TrackList tracks={tracks} onStartRecording={handleOpenSheet} />
      ) : (
        // 보이스 탭 (새로 만든 리스트)
        <VoiceList voices={voiceLibrary} onDeleteVoice={loadVoices} />
      )}
      {/* 2. Track List (or Placeholder) */}
      {/* <TrackList
        tracks={tracks}
        onStartRecording={handleOpenSheet} // Open sheet when the button on the empty screen is pressed
      /> */}

      {/* 3. Bottom Bar (visible only when there are tracks) */}
      <RecordBottomBar
        visible={tracks.length > 0}
        onOpenSheet={handleOpenSheet}
      />

      {/* 4. Recording Sheet */}
      <RecordBottomSheet
        ref={bottomSheetRef}
        onRecordingComplete={onRecordingFinished}
      />
    </YStack>
  );
}
