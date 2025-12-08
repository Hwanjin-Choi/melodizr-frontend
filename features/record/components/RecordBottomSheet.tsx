import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
} from "react";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Button, Text, YStack, H3, useTheme, View } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRecordControl } from "../hooks/useRecordControl";
import {
  ConvertingView,
  IdleView,
  RecordingView,
  ReviewView,
} from "./RecordModalViews";
import { VoiceItem } from "@/services/VoiceLibraryService";

export interface RecordBottomSheetHandle {
  expand: () => void;
  close: () => void;
  openForConversion: (voice: VoiceItem) => void;
  onConversionComplete?: (voice: any, track: any) => void;
}

interface RecordBottomSheetProps {
  onConversionComplete?: (voice: any, track: any) => void;
}

const CustomHandle = () => {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.dark2?.val || "#1E1E1E",
        paddingVertical: 12,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "transparent",
      }}
    >
      <View
        style={{
          width: 60,
          height: 5,
          borderRadius: 4,
          backgroundColor: theme.melodizrOrange?.val || "#888",
        }}
      />
    </View>
  );
};

export const RecordBottomSheet = forwardRef<
  RecordBottomSheetProps,
  RecordBottomSheetHandle
>((props, ref) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const bottomSheetRef = React.useRef<BottomSheet>(null);

  const control = useRecordControl(ref as React.RefObject<BottomSheet>, {
    onConversionComplete: props.onConversionComplete,
  });
  const {
    step,
    snapPoints,
    onStartRecording,
    onStopRecording,
    onConvert,
    setInstrument,
    setIsPlaying,
    instrument,
    isPlaying,
    onCloseSheet,
    durationMillis,
    tempDuration,
    tempUri,
    onUploadFile,
    startFromExistingVoice,
    onRetake,
  } = control;

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.expand(),
    close: () => bottomSheetRef.current?.close(),
    openForConversion: (voice: VoiceItem) => {
      startFromExistingVoice(voice); // 훅의 함수 호출
    },
  }));

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    []
  );

  const CurrentView = useMemo(() => {
    switch (step) {
      case "recording":
        return (
          <RecordingView
            onStopRecording={onStopRecording}
            durationMillis={durationMillis}
          />
        );
      case "review":
        return (
          <ReviewView
            onConvert={onConvert}
            setInstrument={setInstrument}
            instrument={instrument}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            duration={tempDuration}
            uri={tempUri}
            onRetake={onRetake}
          />
        );
      case "converting":
        return <ConvertingView />;
      case "idle":
      default:
        return (
          <IdleView
            onStartRecording={onStartRecording}
            onOpenSheet={() => {}}
            onUploadFile={onUploadFile}
          />
        );
    }
  }, [step, control, durationMillis, tempDuration, isPlaying, instrument]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={step === "idle"}
      handleComponent={CustomHandle}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.dark2?.val || "#1E1E1E" }}
      onClose={onCloseSheet}
    >
      <YStack flex={1} paddingBottom={insets.bottom + 20}>
        {CurrentView}
      </YStack>
    </BottomSheet>
  );
});
