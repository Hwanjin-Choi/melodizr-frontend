import React, {
  forwardRef,
  useCallback,
  useMemo,
  useImperativeHandle,
} from "react";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { YStack, useTheme, View } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRecordControl } from "../hooks/useRecordControl";
import {
  ConvertingView,
  IdleView,
  RecordingView,
  ReviewView,
  CountingView,
} from "./RecordModalViews";
import { VoiceItem } from "@/services/VoiceLibraryService";

export interface RecordBottomSheetHandle {
  expand: () => void;
  close: () => void;
  openForConversion: (voice: VoiceItem) => void;
}

interface RecordBottomSheetProps {
  onConversionComplete?: (voice: any, track: any) => void;
  bpm?: number;
  bars?: number;
}

const CustomHandle = () => {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.dark2?.val || "#1E1E1E",
        paddingVertical: 16,
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
  RecordBottomSheetHandle,
  RecordBottomSheetProps
>((props, ref) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = React.useRef<BottomSheet>(null);

  const control = useRecordControl(ref as React.RefObject<BottomSheet>, {
    onConversionComplete: props.onConversionComplete,
    bpm: props.bpm,
    bars: props.bars,
  });

  const {
    step,
    snapPoints,
    onStartRecording,
    onStopRecording,
    onConvert,
    setMode,
    mode,
    setIsPlaying,
    textPrompt,
    setTextPrompt,
    isPlaying,
    onCloseSheet,
    durationMillis,
    tempDuration,
    tempUri,
    onUploadFile,
    startFromExistingVoice,
    onRetake,
    countdownValue,
    maxDuration,
    bpm,
    targetInstrument,
    setTargetInstrument,
    tunePreset,
    setTunePreset,
    keyHint,
    setKeyHint,
  } = control;

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.expand(),
    close: () => bottomSheetRef.current?.close(),
    openForConversion: (voice: VoiceItem) => {
      startFromExistingVoice(voice);
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
      case "counting":
        return <CountingView count={countdownValue} bpm={bpm} />;
      case "recording":
        return (
          <RecordingView
            onStopRecording={onStopRecording}
            durationMillis={durationMillis}
            maxDuration={maxDuration}
            bpm={bpm}
          />
        );
      case "review":
        return (
          <ReviewView
            onConvert={onConvert}
            setMode={setMode}
            mode={mode}
            textPrompt={textPrompt}
            setTextPrompt={setTextPrompt}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            duration={tempDuration}
            uri={tempUri}
            onRetake={onRetake}
            targetInstrument={targetInstrument}
            setTargetInstrument={setTargetInstrument}
            tunePreset={tunePreset}
            setTunePreset={setTunePreset}
            keyHint={keyHint}
            setKeyHint={setKeyHint}
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
  }, [
    step,
    control,
    durationMillis,
    tempDuration,
    isPlaying,
    mode,
    textPrompt,
    countdownValue,
    maxDuration,
    bpm,
    targetInstrument,
    tunePreset,
    keyHint,
  ]);

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
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <YStack flex={1} paddingBottom={insets.bottom + 20}>
        {CurrentView}
      </YStack>
    </BottomSheet>
  );
});
