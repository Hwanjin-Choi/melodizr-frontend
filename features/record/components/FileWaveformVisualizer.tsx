// features/record/components/FileWaveformVisualizer.tsx

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTheme, View } from "tamagui";
import {
  Waveform,
  IWaveformRef,
  PlayerState,
  FinishMode,
} from "@simform_solutions/react-native-audio-waveform";

export const FileWaveformVisualizer = forwardRef(
  (
    {
      uri,
      onStateChange,
      progress,
      isPlaying,
    }: {
      uri: string | null;
      onStateChange?: (state: PlayerState) => void;
      progress: number;
      isPlaying: boolean;
    },
    ref
  ) => {
    const theme = useTheme();
    const waveformRef = useRef<IWaveformRef>(null);

    if (!uri) return null;

    return (
      <View width="100%" height="100%">
        <Waveform
          ref={waveformRef}
          key={uri}
          mode="static"
          path={uri}
          containerStyle={{ width: "100%", height: "100%" }}
          candleWidth={3}
          candleSpace={2}
          candleHeightScale={4}
          waveColor={isPlaying ? theme.accent.val : "white"}
          scrubColor={theme.accent?.val || "#FF8C00"}
        />
      </View>
    );
  }
);
