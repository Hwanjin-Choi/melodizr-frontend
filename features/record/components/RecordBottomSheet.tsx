import React, { forwardRef, useCallback, useMemo, useRef } from "react";
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

interface RecordBottomSheetProps {
  onRecordingComplete?: (uri: string, duration: number) => void;
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
  BottomSheet,
  RecordBottomSheetProps
>((props, ref) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const control = useRecordControl(ref as React.RefObject<BottomSheet>, {
    onRecordingComplete: props.onRecordingComplete,
  });

  const {
    step,
    snapPoints,
    onStartRecording,
    onStopRecording,
    onConvert,
    onVoiceTypeChange,
    setInstrument,
    setIsPlaying,
    voiceType,
    instrument,
    isPlaying,
    onCloseSheet,
    durationMillis,
  } = control;

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
            onVoiceTypeChange={onVoiceTypeChange}
            setInstrument={setInstrument}
            voiceType={voiceType}
            instrument={instrument}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
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
          />
        );
    }
  }, [step, control, durationMillis]);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={step !== "recording" && step !== "converting"}
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
