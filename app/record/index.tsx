import React, { useCallback, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Button, Text, YStack, H3 } from "tamagui";

export default function RecordPage() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%"], []);

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  return (
    <YStack f={1} ai="center" jc="center" bg="$background" p="$4">
      <H3 mb="$4">녹음 스튜디오</H3>
      <Button onPress={handleOpenSheet} size="$5" theme="active">
        녹음 시작
      </Button>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
      >
        <BottomSheetView style={styles.contentContainer}>
          <YStack p="$5" ai="center">
            <H3>🎙️ 설정</H3>
            <Text mt="$2">녹음 옵션을 선택해주세요.</Text>
          </YStack>
        </BottomSheetView>
      </BottomSheet>
    </YStack>
  );
}

const styles = StyleSheet.create({
  contentContainer: { flex: 1 },
});
