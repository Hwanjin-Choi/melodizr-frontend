import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Button, Text, YStack, H3 } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecordHeader } from "@/features/record/components/RecordHeader";
import { TrackList, type Track } from "@/features/record/components/TrackList";
import { RecordBottomBar } from "@/features/record/components/RecordBottomBarProps";
import { RecordBottomSheet } from "@/features/record/components/RecordBottomSheet";

export default function RecordPage() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isProject, setIsProject] = useState(true);

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

  return (
    <YStack flex={1} bg="$background" paddingTop={insets.top}>
      {/* 1. Header */}
      <RecordHeader isProject={isProject} onTabChange={setIsProject} />

      {/* 2. Track List (or Placeholder) */}
      <TrackList
        tracks={tracks}
        onStartRecording={handleOpenSheet} // Open sheet when the button on the empty screen is pressed
      />

      {/* 3. Bottom Bar (visible only when there are tracks) */}
      <RecordBottomBar
        visible={tracks.length > 0}
        onOpenSheet={handleOpenSheet}
      />

      {/* 4. Recording Sheet */}
      <RecordBottomSheet ref={bottomSheetRef} />
    </YStack>
  );
}
