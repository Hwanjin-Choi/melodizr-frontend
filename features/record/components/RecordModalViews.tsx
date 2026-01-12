import {
  Mic,
  Pause,
  Play,
  Upload,
  RefreshCcw,
  Check,
  Music,
} from "@tamagui/lucide-icons";
import React, { useEffect, useState, useMemo } from "react";
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
  Stack,
  useTheme,
  styled,
} from "tamagui";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { RecordControl, MODE_OPTIONS } from "../hooks/useRecordControl";
import { Audio } from "expo-av";

// ------------------------------------
// Step 0: Idle View
// ------------------------------------
export const IdleView = ({
  onOpenSheet,
  onStartRecording,
  onUploadFile,
}: Pick<RecordControl, "onStartRecording" | "onUploadFile"> & {
  onOpenSheet: () => void;
}) => (
  <YStack flex={1} ai="center" jc="center" gap="$6" px="$6">
    <Text color="white" fontSize="$5" fontWeight="bold">
      Ready?
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
        pressStyle={{
          backgroundColor: "$accentPress",
          opacity: 1,
        }}
      >
        <Mic size={40} color="white" />
      </Button>
    </Circle>

    <Text color="$grayText" fontSize="$4" fontWeight="bold">
      Tap to start recording
    </Text>

    <Button
      variant="outlined"
      borderColor="$dark3"
      fontWeight="bold"
      color="$grayText"
      icon={<Upload size={16} />}
      borderRadius="$10"
      mt="$2"
      onPress={onUploadFile}
    >
      Or upload audio file
    </Button>
  </YStack>
);

// ------------------------------------
// Step 1: Counting View
// ------------------------------------
export const CountingView = ({
  count,
  bpm = 120,
}: {
  count: number;
  bpm?: number;
}) => (
  <YStack flex={1} ai="center" jc="center" gap="$6">
    <EngagingMetronome bpm={bpm} active={true} />

    <YStack ai="center" gap="$2">
      <Text color="$accent" fontSize={60} fontWeight="900" animation="quick">
        {count}
      </Text>
      <Text color="$grayText" fontSize="$5" textAlign="center">
        Get Ready...{"\n"}
        Recording will start soon
      </Text>
    </YStack>
  </YStack>
);

// ------------------------------------
// Step 2: Recording View (Updated)
// ------------------------------------
const formatDuration = (millis: number) => {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

export const RecordingWaveform = () => (
  <XStack gap="$1" height={60} ai="center" jc="center">
    {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((i, index) => (
      <AnimatedBar key={index} delay={index * 100} />
    ))}
  </XStack>
);

export const RecordingView = ({
  onStopRecording,
  durationMillis = 0,
  maxDuration = 0,
  bpm = 120, // [추가] BPM 받기
}: Pick<RecordControl, "onStopRecording"> & {
  durationMillis?: number;
  maxDuration?: number;
  bpm?: number;
}) => {
  const timeLeft = Math.max(0, maxDuration - durationMillis);

  return (
    <YStack flex={1} ai="center" jc="center" px="$6" gap="$4">
      {/* [추가] 녹음 중 시각적 메트로놈 표시 */}
      <EngagingMetronome bpm={bpm} active={true} />

      <Text color="$melodizrOrange" fontSize="$6" fontWeight="bold">
        {formatDuration(timeLeft)} left
      </Text>

      <YStack
        width="100%"
        bg="$dark1"
        borderRadius="$6"
        borderWidth={1}
        borderColor="$textSecondary"
        ai="center"
        jc="center"
        py="$4"
        position="relative"
        overflow="hidden"
      >
        <View
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          bg="$dark2"
          width={`${(durationMillis / maxDuration) * 100}%`}
          opacity={0.3}
        />
        <RecordingWaveform />
      </YStack>

      <YStack ai="center" gap="$2">
        <Circle
          onPress={onStopRecording}
          size={72}
          borderWidth={4}
          borderColor="$melodizrOrange"
          p={4}
          pressStyle={{ opacity: 0.8, scale: 0.95 }}
        >
          <Button
            circular
            bg="$melodizrOrange"
            unstyled
            ai="center"
            jc="center"
            pointerEvents="none"
          >
            <Stack width={20} height={20} bg="red" borderRadius={4} />
          </Button>
        </Circle>
        <Text color="$grayText" fontSize="$3">
          Tap to stop
        </Text>
      </YStack>
    </YStack>
  );
};

// ------------------------------------
// Step 3: Review View
// ------------------------------------
export const ReviewView = ({
  onConvert,
  setMode,
  mode,
  textPrompt,
  setTextPrompt,
  isPlaying,
  setIsPlaying,
  duration = 0,
  uri,
  onRetake,
}: Pick<
  RecordControl,
  | "onConvert"
  | "setMode"
  | "mode"
  | "isPlaying"
  | "setIsPlaying"
  | "onRetake"
  | "textPrompt"
  | "setTextPrompt"
> & { duration?: number; uri?: string | null }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const theme = useTheme();

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleTogglePlay = async () => {
    if (!uri) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            if (status.positionMillis >= status.durationMillis!) {
              await sound.replayAsync();
            } else {
              await sound.playAsync();
            }
            setIsPlaying(true);
          }
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Playback failed", error);
    }
  };

  return (
    <ScrollView
      flex={1}
      contentContainerStyle={{
        padding: 24,
        flexGrow: 1,
        justifyContent: "center",
      }}
      keyboardShouldPersistTaps="handled"
    >
      <YStack gap="$5">
        {/* Playback Control */}
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
              {formatDuration(duration)}
            </Text>
            <XStack gap="$1" ai="center" height={40}>
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
              onPress={handleTogglePlay}
            />
          </XStack>
        </YStack>

        {/* Mode Selector */}
        <YStack gap="$3">
          <Text color="$grayText" fontSize="$3" ml="$1" fontWeight="bold">
            Select Mode
          </Text>
          <XStack gap="$3">
            {MODE_OPTIONS.map((option) => {
              const isSelected = mode === option.value;
              return (
                <Button
                  key={option.value}
                  flex={1}
                  size="$4"
                  bg={isSelected ? "$accent" : "$dark2"}
                  borderColor={isSelected ? "$accent" : "$dark3"}
                  borderWidth={1}
                  onPress={() => setMode(option.value)}
                  pressStyle={{ opacity: 0.9 }}
                >
                  <Text
                    color={isSelected ? "white" : "$grayText"}
                    fontWeight={isSelected ? "bold" : "normal"}
                  >
                    {option.label}
                  </Text>
                  {isSelected && <Check size={16} color="white" />}
                </Button>
              );
            })}
          </XStack>
        </YStack>

        {/* Text Prompt Input */}
        <YStack gap="$2">
          <Text color="$grayText" fontSize="$3" ml="$1" fontWeight="bold">
            Describe Style
          </Text>
          <BottomSheetTextInput
            value={textPrompt}
            onChangeText={setTextPrompt}
            maxLength={100}
            placeholder="E.g., fast rock guitar, jazzy piano..."
            placeholderTextColor={theme.grayText?.val || "#666"}
            style={{
              backgroundColor: theme.dark2?.val || "#1E1E1E",
              color: "#fff",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              borderWidth: 1,
              borderColor: theme.dark3?.val || "#333",
            }}
          />
        </YStack>

        {/* Action Buttons */}
        <Button
          mt="$4"
          size="$5"
          backgroundColor="$accent"
          onPress={onConvert}
          pressStyle={{ bg: "$accentPress" }}
        >
          <Text color="white" fontWeight="bold" fontSize="$4">
            Convert & Save
          </Text>
        </Button>

        <Button
          size="$4"
          variant="outlined"
          borderColor="$dark3"
          color="$red9"
          icon={<RefreshCcw size={16} />}
          onPress={onRetake}
          pressStyle={{ bg: "$dark2", opacity: 0.8 }}
        >
          Retake / Cancel
        </Button>
      </YStack>
    </ScrollView>
  );
};

// ------------------------------------
// Step 4: Converting View
// ------------------------------------
export const ConvertingView = () => (
  <YStack flex={1} ai="center" jc="center" gap="$6">
    <Spinner size="large" color="$accent" />
    <YStack ai="center" gap="$2">
      <Text color="white" fontSize="$6" fontWeight="bold">
        Processing...
      </Text>
      <Text color="$grayText" textAlign="center">
        Generating your track based on settings.{"\n"}
        This may take a moment.
      </Text>
    </YStack>
  </YStack>
);

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

// ------------------------------------
// Helper Components (Metronome)
// ------------------------------------

const PulsingRingView = styled(View, {
  position: "absolute",
  width: 80,
  height: 80,
  borderRadius: 40,
  borderWidth: 3,
  borderColor: "$accent",
  opacity: 0,
  variants: {
    pulse: {
      true: {
        animation: { type: "timing", duration: 1000, loop: true },
        scale: 2.5,
        opacity: 0,
        enterStyle: { scale: 0.8, opacity: 0.6 },
      },
    },
    strong: { true: { borderColor: "$accent", borderWidth: 5 } },
  } as const,
});

const PulsingRing = ({ active, bpm, strong }: any) => {
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (strong) setKey((k) => k + 1);
  }, [strong]);
  if (!active) return null;
  return strong ? <PulsingRingView key={key} pulse strong={strong} /> : null;
};

const EngagingMetronome = ({
  bpm,
  active,
}: {
  bpm: number;
  active: boolean;
}) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const intervalMs = (60 / bpm) * 1000;
    const timer = setInterval(() => setTick((t) => (t + 1) % 4), intervalMs);
    return () => clearInterval(timer);
  }, [bpm, active]);
  const isFirstBeat = tick === 0;
  return (
    <YStack
      alignItems="center"
      justifyContent="center"
      height={120}
      width="100%"
      overflow="hidden"
    >
      <PulsingRing active={active} bpm={bpm} strong={isFirstBeat} />
      <YStack alignItems="center" gap="$3" zIndex={1}>
        <View
          width={60}
          height={60}
          borderRadius={30}
          backgroundColor="$accent"
          alignItems="center"
          justifyContent="center"
          animation="bouncy"
          scale={isFirstBeat ? 1.3 : 1.1}
          opacity={isFirstBeat ? 1 : 0.8}
        >
          <Music size={24} color="white" />
        </View>
        <XStack gap="$2">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              width={8}
              height={8}
              borderRadius={4}
              backgroundColor={tick === i ? "$accent" : "$dark4"}
              animation="quick"
              scale={tick === i ? 1.4 : 1}
              opacity={tick === i ? 1 : 0.4}
            />
          ))}
        </XStack>
      </YStack>
    </YStack>
  );
};
