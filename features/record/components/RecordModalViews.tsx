import { Mic, Pause, Play, StopCircle, Upload } from "@tamagui/lucide-icons";
import React, { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  Button,
  Circle,
  ScrollView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import {
  INSTRUMENT_OPTIONS,
  RecordControl,
  VOICE_OPTIONS,
} from "../hooks/useRecordControl";

// ------------------------------------
// Step 1: Idle View
// ------------------------------------
export const IdleView = ({
  onOpenSheet,
  onStartRecording,
}: Pick<RecordControl, "onStartRecording"> & {
  onOpenSheet: () => void;
}) => (
  <YStack flex={1} ai="center" jc="center" gap="$6" px="$6">
    <Text color="$textPrimary" fontSize={48} fontWeight="bold">
      00:00
    </Text>

    <Circle
      size={100}
      borderWidth={3}
      borderColor="$dark3"
      ai="center"
      jc="center"
    >
      <Button
        size="$8"
        circular
        backgroundColor="$accent"
        onPress={onStartRecording}
        pressStyle={{ scale: 0.95 }}
      >
        <Mic size={40} color="white" />
      </Button>
    </Circle>

    <Text color="$grayText">Tap to start recording</Text>

    <Button
      variant="outlined"
      borderColor="$dark3"
      color="$grayText"
      icon={<Upload size={16} />}
      borderRadius="$10"
      mt="$2"
      // TODO: File upload logic
      onPress={() => console.log("Upload file clicked")}
    >
      Or upload audio file
    </Button>
  </YStack>
);

// ------------------------------------
// Step 2: Recording View
// ------------------------------------
export const RecordingWaveform = () => (
  <XStack gap="$1" height={60} ai="center" jc="center">
    {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((i, index) => (
      <AnimatedBar key={index} delay={index * 100} />
    ))}
  </XStack>
);

export const RecordingView = ({
  onStopRecording,
}: Pick<RecordControl, "onStopRecording">) => (
  <YStack flex={1} ai="center" jc="center" gap="$6" px="$6">
    <RecordingWaveform />
    <Text color="$textPrimary" fontSize={60} fontWeight="bold">
      00:05 {/* TODO: Display actual recording time */}
    </Text>
    <Circle
      size={100}
      borderWidth={3}
      borderColor="$red10"
      ai="center"
      jc="center"
    >
      <Button
        size="$8"
        circular
        backgroundColor="$red10"
        onPress={onStopRecording}
        pressStyle={{ scale: 0.95 }}
      >
        <StopCircle size={40} color="white" />
      </Button>
    </Circle>
    <Text color="$grayText">Recording...</Text>
  </YStack>
);

// ------------------------------------
// Step 3: Review View
// ------------------------------------
const CustomSelect = ({ options, value, onChange }: any) => (
  <XStack gap="$2" flexWrap="wrap">
    {options.map((opt: any) => {
      const isSelected = value === opt.value;
      return (
        <Button
          key={opt.value}
          size="$3"
          borderWidth={1}
          borderColor={isSelected ? "$accent" : "$dark3"}
          backgroundColor={isSelected ? "$accent" : "transparent"}
          onPress={() => onChange(opt.value)}
          pressStyle={{ opacity: 0.8 }}
        >
          <Text
            color={isSelected ? "white" : "$grayText"}
            fontWeight={isSelected ? "bold" : "normal"}
          >
            {opt.label}
          </Text>
        </Button>
      );
    })}
  </XStack>
);

export const ReviewView = ({
  onConvert,
  onVoiceTypeChange,
  setInstrument,
  voiceType,
  instrument,
  isPlaying,
  setIsPlaying,
}: Pick<
  RecordControl,
  | "onConvert"
  | "onVoiceTypeChange"
  | "setInstrument"
  | "voiceType"
  | "instrument"
  | "isPlaying"
  | "setIsPlaying"
>) => (
  <ScrollView
    flex={1}
    contentContainerStyle={{
      padding: 24,
      flexGrow: 1,
      justifyContent: "center",
    }}
  >
    <YStack gap="$5">
      <Text
        color="$textPrimary"
        fontSize="$6"
        fontWeight="bold"
        textAlign="center"
      >
        Convert Voice
      </Text>

      <YStack
        bg="$dark1"
        p="$4"
        borderRadius="$4"
        gap="$3"
        borderWidth={1}
        borderColor="$dark3"
      >
        <XStack ai="center" jc="space-between">
          <Text color="$grayText" fontSize="$3">
            00:05 {/* TODO: Actual recorded length */}
          </Text>
          <XStack gap="$1" ai="center" height={40}>
            {/* Temporary waveform visualization */}
            {Array.from({ length: 20 }).map((_, i) => (
              <View
                key={i}
                width={3}
                height={Math.random() * 20 + 10}
                bg="$accent"
                borderRadius={2}
                opacity={0.6}
              />
            ))}
          </XStack>
          <Button
            size="$3"
            circular
            icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
            onPress={() => setIsPlaying(!isPlaying)}
          />
        </XStack>
      </YStack>

      <YStack gap="$2">
        <Text color="$grayText" fontSize="$3" ml="$1">
          Voice Type
        </Text>
        <CustomSelect
          options={VOICE_OPTIONS}
          value={voiceType}
          onChange={onVoiceTypeChange}
        />
      </YStack>

      <YStack gap="$2">
        <Text color="$grayText" fontSize="$3" ml="$1">
          Target Instrument
        </Text>
        <CustomSelect
          options={INSTRUMENT_OPTIONS[voiceType]}
          value={instrument}
          onChange={setInstrument}
        />
      </YStack>

      <Button
        mt="$4"
        size="$5"
        backgroundColor="$accent"
        onPress={onConvert}
        pressStyle={{ bg: "$accentPress" }}
      >
        <Text color="white" fontWeight="bold" fontSize="$5">
          Convert Voice
        </Text>
      </Button>
    </YStack>
  </ScrollView>
);

// ------------------------------------
// Step 4: Converting View
// ------------------------------------
export const ConvertingView = () => (
  <YStack flex={1} ai="center" jc="center" gap="$6">
    <Spinner size="large" color="$accent" />
    <YStack ai="center" gap="$2">
      <Text color="$textPrimary" fontSize="$6" fontWeight="bold">
        Converting...
      </Text>
      <Text color="$grayText">Creating your instrument track</Text>
    </YStack>
  </YStack>
);

// ------------------------------------
// Helper component: AnimatedBar (for RecordingWaveform)
// ------------------------------------
const AnimatedBar = ({ delay }: { delay: number }) => {
  const height = useSharedValue(10);
  useEffect(() => {
    height.value = withRepeat(
      withTiming(Math.random() * 40 + 10, {
        duration: 500 + Math.random() * 500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));
  return (
    <Animated.View
      style={[
        { width: 4, backgroundColor: "#FF8C00", borderRadius: 2 },
        animatedStyle,
      ]}
    />
  );
};
