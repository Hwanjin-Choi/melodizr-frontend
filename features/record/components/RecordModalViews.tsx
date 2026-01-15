import {
  Mic,
  Pause,
  Play,
  Upload,
  RefreshCcw,
  Check,
  Music,
  ChevronRight,
  ChevronDown,
  HelpCircle, // [추가] 아이콘
} from "@tamagui/lucide-icons";
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  Separator,
  Sheet,
} from "tamagui";
import {
  BottomSheetTextInput,
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  RecordControl,
  MODE_OPTIONS,
  TUNE_PRESET_OPTIONS,
  INSTRUMENT_OPTIONS,
  KEY_SCALE_OPTIONS,
} from "../hooks/useRecordControl";
import { Audio } from "expo-av";

// ... (SettingsRow, GenericSelector, IdleView, CountingView, RecordingView 등 이전 코드와 동일)

// ------------------------------------
// Reusable Modern Components
// ------------------------------------

const SettingsRow = ({
  label,
  value,
  onPress,
  isLast = false,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
}) => {
  return (
    <Button
      chromeless
      onPress={onPress}
      p="$4"
      h="$6"
      jc="space-between"
      borderBottomWidth={isLast ? 0 : 1}
      borderBottomColor="$dark3"
      pressStyle={{ bg: "$dark3" }}
    >
      <Text color="white" fontSize="$4" fontWeight="500">
        {label}
      </Text>
      <XStack ai="center" gap="$2">
        <Text color="$accent" fontSize="$4" fontWeight="600">
          {value || "Select"}
        </Text>
        <ChevronRight size={18} color="$grayText" />
      </XStack>
    </Button>
  );
};

const GenericSelector = ({
  title,
  options,
  value,
  onChange,
  trigger,
}: {
  title: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  trigger: (open: () => void) => React.ReactNode;
}) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const theme = useTheme();

  const handlePresent = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    bottomSheetModalRef.current?.dismiss();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <>
      {trigger(handlePresent)}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.dark2?.val || "#1E1E1E" }}
        handleIndicatorStyle={{
          backgroundColor: theme.grayText?.val || "#888",
        }}
      >
        <BottomSheetView style={{ padding: 16, paddingBottom: 40 }}>
          <Text
            color="white"
            fontSize="$5"
            fontWeight="bold"
            textAlign="center"
            mb="$4"
          >
            {title}
          </Text>
          <YStack gap="$2">
            {options.map((item) => {
              const isSelected = item.value === value;
              return (
                <Button
                  key={item.value}
                  onPress={() => handleSelect(item.value)}
                  bg={isSelected ? "$dark3" : "transparent"}
                  borderColor={isSelected ? "$accent" : "$dark3"}
                  borderWidth={1}
                  jc="space-between"
                  height="$5"
                >
                  <Text
                    color={isSelected ? "white" : "$grayText"}
                    fontWeight={isSelected ? "bold" : "normal"}
                  >
                    {item.label}
                  </Text>
                  {isSelected && <Check size={18} color="$accent" />}
                </Button>
              );
            })}
          </YStack>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
};

// ... (IdleView, CountingView, RecordingView, RecordingWaveform 등은 변경 없음)
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
        pressStyle={{ backgroundColor: "$accentPress", opacity: 1 }}
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
        Get Ready...{"\n"}Recording will start soon
      </Text>
    </YStack>
  </YStack>
);

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
  bpm = 120,
}: any) => {
  const timeLeft = Math.max(0, maxDuration - durationMillis);
  return (
    <YStack flex={1} ai="center" jc="center" px="$6" gap="$4">
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
// Step 3: Review View (Updated)
// ------------------------------------
export const ReviewView = ({
  onConvert,
  setMode,
  mode,
  textPrompt,
  setTextPrompt,
  targetInstrument,
  setTargetInstrument,
  tunePreset,
  setTunePreset,
  keyHint,
  setKeyHint,
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
  | "targetInstrument"
  | "setTargetInstrument"
  | "tunePreset"
  | "setTunePreset"
  | "keyHint"
  | "setKeyHint"
> & { duration?: number; uri?: string | null }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const guidelineSheetRef = useRef<BottomSheetModal>(null); // [추가] 가이드라인 시트 Ref
  const theme = useTheme();

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
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
            if (status.positionMillis >= status.durationMillis!)
              await sound.replayAsync();
            else await sound.playAsync();
            setIsPlaying(true);
          }
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
        });
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Playback failed", error);
    }
  };

  // [추가] 가이드라인 시트 열기
  const handleOpenGuideline = useCallback(() => {
    guidelineSheetRef.current?.present();
  }, []);

  // [추가] 가이드라인 시트 백드롭
  const renderGuidelineBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <YStack flex={1}>
      <ScrollView
        flex={1}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$6">
          {/* 1. Playback Card */}
          <XStack
            bg="$dark2"
            p="$3"
            borderRadius="$6"
            ai="center"
            gap="$3"
            borderWidth={1}
            borderColor="$dark3"
          >
            <Button
              size="$3"
              circular
              icon={isPlaying ? <Pause size={14} /> : <Play size={14} ml={2} />}
              onPress={handleTogglePlay}
              bg="$accent"
            />
            <YStack flex={1} gap="$1">
              <Text color="white" fontSize="$4" fontWeight="bold">
                Original Audio
              </Text>
              <Text color="$grayText" fontSize="$2">
                {formatDuration(duration)}
              </Text>
            </YStack>
            <XStack gap="$1" ai="center" height={24} opacity={0.5}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={i}
                  width={3}
                  height={Math.random() * 14 + 6}
                  bg="white"
                  borderRadius={2}
                />
              ))}
            </XStack>
          </XStack>

          {/* 2. Mode Segmented Control with Guideline Button */}
          <YStack gap="$3">
            {/* [수정] 라벨과 가이드라인 버튼을 양옆으로 배치 */}
            <XStack jc="space-between" ai="center">
              <Text
                color="$grayText"
                fontSize="$3"
                ml="$1"
                fontWeight="700"
                textTransform="uppercase"
              >
                Conversion Mode
              </Text>
              <Button
                size="$2"
                circular
                chromeless
                icon={<HelpCircle size={18} color="$grayText" />}
                onPress={handleOpenGuideline}
                pressStyle={{ bg: "$dark2" }}
              />
            </XStack>

            <XStack
              bg="$dark1"
              p="$1"
              borderRadius="$6"
              height={50}
              borderWidth={1}
              borderColor="$dark3"
            >
              {MODE_OPTIONS.map((option) => {
                const isSelected = mode === option.value;
                return (
                  <Button
                    key={option.value}
                    flex={1}
                    chromeless
                    bg={isSelected ? "$dark3" : "transparent"}
                    borderRadius="$4"
                    onPress={() => setMode(option.value)}
                    animation="quick"
                    pressStyle={{ bg: isSelected ? "$dark3" : "$dark2" }}
                  >
                    <Text
                      color={isSelected ? "white" : "$grayText"}
                      fontWeight={isSelected ? "bold" : "600"}
                    >
                      {option.label}
                    </Text>
                  </Button>
                );
              })}
            </XStack>
          </YStack>

          {/* 3. Dynamic Settings Form */}
          <YStack gap="$3" animation="quick">
            <Text
              color="$grayText"
              fontSize="$3"
              ml="$1"
              fontWeight="700"
              textTransform="uppercase"
            >
              Settings
            </Text>

            <YStack
              bg="$dark2"
              borderRadius="$6"
              overflow="hidden"
              borderWidth={1}
              borderColor="$dark3"
            >
              {/* INSTRUMENT MODE SETTINGS */}
              {mode === "instrument" && (
                <>
                  <GenericSelector
                    title="Select Instrument"
                    options={INSTRUMENT_OPTIONS}
                    value={targetInstrument}
                    onChange={setTargetInstrument}
                    trigger={(open) => (
                      <SettingsRow
                        label="Instrument"
                        value={
                          INSTRUMENT_OPTIONS.find(
                            (i) => i.value === targetInstrument
                          )?.label
                        }
                        onPress={open}
                      />
                    )}
                  />

                  <GenericSelector
                    title="Tune Intensity (Optional)"
                    options={TUNE_PRESET_OPTIONS}
                    value={tunePreset}
                    onChange={setTunePreset}
                    trigger={(open) => (
                      <SettingsRow
                        label="Tune Intensity"
                        value={
                          TUNE_PRESET_OPTIONS.find(
                            (t) => t.value === tunePreset
                          )?.label
                        }
                        onPress={open}
                      />
                    )}
                  />

                  <YStack
                    p="$4"
                    borderBottomWidth={1}
                    borderBottomColor="transparent"
                  >
                    <Text color="white" fontSize="$4" fontWeight="500" mb="$2">
                      Style Prompt
                    </Text>
                    <BottomSheetTextInput
                      value={textPrompt}
                      onChangeText={setTextPrompt}
                      maxLength={100}
                      placeholder="Ex: Funky rhythm, Jazzy feel..."
                      placeholderTextColor="#666"
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        padding: 0,
                        height: 24,
                      }}
                    />
                  </YStack>
                </>
              )}

              {/* TUNE MODE SETTINGS */}
              {mode === "tune" && (
                <>
                  <GenericSelector
                    title="Select Key"
                    options={KEY_SCALE_OPTIONS}
                    value={keyHint}
                    onChange={setKeyHint}
                    trigger={(open) => (
                      <SettingsRow
                        label="Key Scale"
                        value={
                          KEY_SCALE_OPTIONS.find((k) => k.value === keyHint)
                            ?.label
                        }
                        onPress={open}
                      />
                    )}
                  />

                  <GenericSelector
                    title="Tune Preset"
                    options={TUNE_PRESET_OPTIONS}
                    value={tunePreset}
                    onChange={setTunePreset}
                    trigger={(open) => (
                      <SettingsRow
                        label="Tune Intensity"
                        value={
                          TUNE_PRESET_OPTIONS.find(
                            (t) => t.value === tunePreset
                          )?.label
                        }
                        onPress={open}
                        isLast={true}
                      />
                    )}
                  />
                </>
              )}
            </YStack>

            {/* <Text
              color="$grayText"
              fontSize="$2"
              textAlign="center"
              mt="$2"
              opacity={0.6}
            >
              {mode === "instrument"
                ? "AI will generate an instrument track based on your humming."
                : "Your voice will be auto-tuned to the selected key."}
            </Text> */}
          </YStack>
        </YStack>
      </ScrollView>

      {/* Footer Actions */}
      <YStack
        px="$4"
        pt="$3"
        pb="$2"
        bg="$dark2"
        borderTopWidth={1}
        borderColor="$dark3"
        gap="$3"
      >
        <Button
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
        >
          Retake
        </Button>
      </YStack>

      {/* [추가] Guideline BottomSheet */}
      <BottomSheetModal
        ref={guidelineSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderGuidelineBackdrop}
        backgroundStyle={{ backgroundColor: theme.dark2?.val || "#1E1E1E" }}
        handleIndicatorStyle={{
          backgroundColor: theme.grayText?.val || "#888",
        }}
      >
        <BottomSheetView style={{ padding: 24, paddingBottom: 40 }}>
          <Text
            color="white"
            fontSize="$5"
            fontWeight="bold"
            textAlign="center"
            mb="$4"
          >
            What is Conversion Mode?
          </Text>
          <ScrollView style={{ maxHeight: 300 }}>
            <YStack gap="$3">
              <Text color="$grayText" fontSize="$4" lineHeight={24}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Text>
              <Text color="$grayText" fontSize="$4" lineHeight={24}>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
              </Text>
              <Text color="$grayText" fontSize="$4" lineHeight={24}>
                Excepteur sint occaecat cupidatat non proident, sunt in culpa
                qui officia deserunt mollit anim id est laborum.
              </Text>
            </YStack>
          </ScrollView>
          <Button
            mt="$4"
            bg="$accent"
            onPress={() => guidelineSheetRef.current?.dismiss()}
          >
            <Text color="white" fontWeight="bold">
              Got it
            </Text>
          </Button>
        </BottomSheetView>
      </BottomSheetModal>
    </YStack>
  );
};

// ... (ConvertingView, AnimatedBar, EngagingMetronome 등 이전 코드와 동일)
export const ConvertingView = () => (
  <YStack flex={1} ai="center" jc="center" gap="$6">
    <Spinner size="large" color="$accent" />
    <YStack ai="center" gap="$2">
      <Text color="white" fontSize="$6" fontWeight="bold">
        Processing...
      </Text>
      <Text color="$grayText" textAlign="center">
        Generating your track...{"\n"}Almost done.
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
