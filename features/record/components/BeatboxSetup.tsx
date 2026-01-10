import React, { useState, useEffect, useRef } from "react";
import {
  YStack,
  XStack,
  Text,
  Button,
  Slider,
  Sheet,
  View,
  styled,
  ScrollView,
  Spinner,
} from "tamagui";
import { Audio } from "expo-av";
import { Asset } from "expo-asset";
import {
  Mic,
  Play,
  Square,
  Check,
  ChevronLeft,
  RefreshCcw,
  Circle,
  Music,
  Wand2,
  FileAudio,
  Drum,
} from "@tamagui/lucide-icons";

import { TrackItem } from "@/services/TrackLibraryService";
import { TriaApiService } from "@/services/TriaApiService";

const TIMBRE_COLLECTION = [
  {
    id: "1",
    label: "Timbre 1",
    value: "timbre_1",
    uri: require("@/assets/timbre/timbre1.wav"),
  },
  {
    id: "2",
    label: "Timbre 2",
    value: "timbre_2",
    uri: require("@/assets/timbre/timbre2.wav"),
  },
  {
    id: "3",
    label: "Timbre 3",
    value: "timbre_3",
    uri: require("@/assets/timbre/timbre3.wav"),
  },
  {
    id: "4",
    label: "Timbre 4",
    value: "timbre_4",
    uri: require("@/assets/timbre/timbre4.wav"),
  },
  {
    id: "5",
    label: "Timbre 5",
    value: "timbre_5",
    uri: require("@/assets/timbre/timbre5.wav"),
  },
  {
    id: "6",
    label: "Timbre 6",
    value: "timbre_6",
    uri: require("@/assets/timbre/timbre6.wav"),
  },
  {
    id: "7",
    label: "Timbre 7",
    value: "timbre_7",
    uri: require("@/assets/timbre/timbre7.wav"),
  },
  {
    id: "8",
    label: "Timbre 8",
    value: "timbre_8",
    uri: require("@/assets/timbre/timbre8.wav"),
  },
];

type Step = "config" | "timbre-select" | "session";
type RecordingState = "idle" | "counting" | "recording" | "review";

interface BeatboxSetupProps {
  onBack: () => void;
  onComplete: (track: TrackItem) => void;
  fixedBpm?: number;
  fixedBars?: number;
}

export const BeatboxSetup = ({
  onBack,
  onComplete,
  fixedBpm,
  fixedBars,
}: BeatboxSetupProps) => {
  const [step, setStep] = useState<Step>("config");

  // Settings
  const [targetBpm, setTargetBpm] = useState(fixedBpm ?? 120);
  const [targetBars, setTargetBars] = useState(fixedBars ?? 4);
  const [selectedTimbre, setSelectedTimbre] = useState(TIMBRE_COLLECTION[0]);

  // Timbre Preview State
  const [timbreSound, setTimbreSound] = useState<Audio.Sound | null>(null);
  const [playingTimbreId, setPlayingTimbreId] = useState<string | null>(null);
  const [isTimbreLoading, setIsTimbreLoading] = useState(false);

  // Session State
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Session Audio State
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const [isPlayingReview, setIsPlayingReview] = useState(false);

  // AI Generation State
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // [추가] 시각적 메트로놈 (Visual Metronome) 상태
  const [metronomeTick, setMetronomeTick] = useState(0);
  const [isBeatFlash, setIsBeatFlash] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      cleanupAllAudio();
    };
  }, []);

  useEffect(() => {
    if (fixedBpm) setTargetBpm(fixedBpm);
    if (fixedBars) setTargetBars(fixedBars);
  }, [fixedBpm, fixedBars]);

  useEffect(() => {
    if (recordingState !== "recording") {
      setIsBeatFlash(false);
      return;
    }

    const intervalMs = (60 / targetBpm) * 1000;

    setIsBeatFlash(true);
    setMetronomeTick(0);
    setTimeout(() => setIsBeatFlash(false), 150);

    const timer = setInterval(() => {
      setMetronomeTick((t) => (t + 1) % 4);
      setIsBeatFlash(true);
      setTimeout(() => setIsBeatFlash(false), 150);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [recordingState, targetBpm]);

  const cleanupAllAudio = async () => {
    if (playbackSound) await playbackSound.unloadAsync();
    if (timbreSound) await timbreSound.unloadAsync();
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  };

  // --- Timbre Preview Logic ---
  const toggleTimbrePreview = async (item: (typeof TIMBRE_COLLECTION)[0]) => {
    try {
      if (playingTimbreId === item.id) {
        if (timbreSound) await timbreSound.stopAsync();
        setPlayingTimbreId(null);
        return;
      }

      setIsTimbreLoading(true);
      if (timbreSound) await timbreSound.unloadAsync();

      const { sound } = await Audio.Sound.createAsync(item.uri, {
        shouldPlay: true,
      });

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingTimbreId(null);
        }
      });

      setTimbreSound(sound);
      setPlayingTimbreId(item.id);
    } catch (e) {
      console.error("Timbre preview failed", e);
    } finally {
      setIsTimbreLoading(false);
    }
  };

  const handleSelectTimbre = async (item: (typeof TIMBRE_COLLECTION)[0]) => {
    if (timbreSound) {
      await timbreSound.stopAsync();
      setPlayingTimbreId(null);
    }
    setSelectedTimbre(item);
    setStep("config");
  };

  // --- Recording Session Logic ---
  const calculateDuration = () => (60 / targetBpm) * 4 * targetBars * 1000;

  const startCountdown = () => {
    setRecordingState("counting");
    setCountdown(4);
    const beatDuration = (60 / targetBpm) * 1000;

    let count = 4;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        startRecording();
      }
    }, beatDuration);
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;

      const maxDuration = calculateDuration();
      setRecordingState("recording");
      setTimeLeft(maxDuration);

      const startTime = Date.now();
      const interval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, maxDuration - elapsed);
        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(interval);
          await stopRecording();
        }
      }, 100);
      timerRef.current = interval;
    } catch (e) {
      console.error(e);
      setRecordingState("idle");
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      const duration = status.durationMillis;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      setRecordingUri(uri);
      setRecordingDuration(duration);
      setRecordingState("review");
      recordingRef.current = null;
    } catch (e) {}
  };

  const handleAiConvert = async () => {
    if (!recordingUri) return;
    try {
      setIsGenerating(true);

      const timbreAsset = Asset.fromModule(selectedTimbre.uri);
      await timbreAsset.downloadAsync();

      if (!timbreAsset.localUri) {
        throw new Error("Timbre asset loading failed");
      }

      const outputUri = await TriaApiService.generateAudio(
        timbreAsset.localUri,
        recordingUri
      );

      const { sound: tempSound, status } = await Audio.Sound.createAsync(
        { uri: outputUri },
        { shouldPlay: false }
      );
      if (status.isLoaded) {
        setRecordingDuration(status.durationMillis || 0);
      }
      await tempSound.unloadAsync();

      setGeneratedUri(outputUri);
    } catch (error) {
      console.error("AI Conversion Failed:", error);
      alert("변환에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleReviewPlay = async (uriOverride?: string) => {
    const targetUri = uriOverride || generatedUri || recordingUri;

    if (isPlayingReview && playbackSound) {
      await playbackSound.stopAsync();
      setIsPlayingReview(false);
      return;
    }
    if (!targetUri) return;

    try {
      if (playbackSound) await playbackSound.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(
        { uri: targetUri },
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setIsPlayingReview(false);
      });
      setPlaybackSound(sound);
      setIsPlayingReview(true);
    } catch (e) {}
  };

  const confirmBeatbox = async () => {
    const finalUri = generatedUri || recordingUri;
    if (!finalUri) return;

    await cleanupAllAudio();

    console.log("[Server Upload Info] Beatbox Created:", {
      uri: finalUri,
      bpm: targetBpm,
      bars: targetBars,
      duration: recordingDuration,
      isAiGenerated: !!generatedUri,
    });

    onComplete({
      id: Date.now().toString(),
      uri: finalUri,
      title: `${selectedTimbre.label} (${generatedUri ? "Beatbox" : "Raw"})`,
      duration: formatMs(recordingDuration),
      durationMillis: recordingDuration,
      createdAt: Date.now(),
      playbackSettings: {
        type: "beatbox",
        originalBpm: targetBpm,
        targetBpm: targetBpm,
        targetBars: targetBars,
        rate: 1.0,
        loopCount: 0,
      },
    });
  };

  const handleBack = () => {
    cleanupAllAudio();
    if (step === "session") {
      setRecordingState("idle");
      setGeneratedUri(null);
      setStep("config");
    } else if (step === "timbre-select") {
      setStep("config");
    } else {
      onBack();
    }
  };

  const handleRetake = () => {
    setRecordingUri(null);
    setGeneratedUri(null);
    setRecordingState("idle");
  };

  const renderHeader = (title: string) => (
    <XStack ai="center" jc="center" h="$4" mb="$2" w="100%" pos="relative">
      <Button
        size="$3"
        chromeless
        icon={<ChevronLeft size={28} color="$textSecondary" />}
        onPress={handleBack}
        pos="absolute"
        left={-10}
        zIndex={10}
        p="$2"
      />
      <Text fontSize="$4" fontWeight="700" color="$textPrimary">
        {title}
      </Text>
    </XStack>
  );

  return (
    <YStack flex={1} gap="$5">
      {step === "config" && (
        <>
          {renderHeader("Setup Beatbox")}
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$6">
              <YStack gap="$3" bg="$surface" p="$4" br="$6">
                <XStack jc="space-between" ai="center">
                  <Text fontSize="$4" fontWeight="600" color="$textPrimary">
                    Tempo (BPM)
                  </Text>
                  <Text fontSize="$6" fontWeight="800" color="$accent">
                    {targetBpm}
                  </Text>
                </XStack>
                <Slider
                  value={[targetBpm]}
                  min={60}
                  max={180}
                  step={1}
                  disabled={fixedBpm ? true : false}
                  onValueChange={(v) => setTargetBpm(v[0])}
                  opacity={fixedBpm ? 0.4 : 1}
                >
                  <Slider.Track bg="$border" height={8}>
                    <Slider.TrackActive bg="$accent" />
                  </Slider.Track>
                  <Slider.Thumb index={0} circular size="$3" bg="$light1" />
                </Slider>
              </YStack>

              <YStack gap="$3" bg="$surface" p="$4" br="$6">
                <XStack jc="space-between" ai="center">
                  <Text fontSize="$4" fontWeight="600" color="$textPrimary">
                    Length
                  </Text>
                  <Text fontSize="$4" color="$textSecondary">
                    {targetBars} Bars
                  </Text>
                </XStack>
                <XStack gap="$3">
                  {[4, 8].map((bars) => (
                    <Button
                      key={bars}
                      flex={1}
                      bg={targetBars === bars ? "$accent" : "$border"}
                      onPress={() => setTargetBars(bars)}
                      pressStyle={{ opacity: 0.8 }}
                      disabled={fixedBars ? true : false}
                      opacity={fixedBars ? 0.4 : 1}
                    >
                      <Text
                        color={targetBars === bars ? "white" : "$textSecondary"}
                        fontWeight="bold"
                      >
                        {bars} Bars
                      </Text>
                    </Button>
                  ))}
                </XStack>
              </YStack>

              <YStack gap="$3">
                <Text
                  fontSize="$4"
                  fontWeight="600"
                  color="$textPrimary"
                  ml="$2"
                >
                  Target Timbre
                </Text>
                <Button
                  onPress={() => setStep("timbre-select")}
                  bg="$surface"
                  borderColor="$border"
                  borderWidth={1}
                  h="$6"
                  jc="space-between"
                  px="$4"
                  pressStyle={{ bg: "$border" }}
                >
                  <XStack gap="$3" ai="center">
                    <View bg="$accent" p="$2" br="$4">
                      <Music size={20} color="white" />
                    </View>
                    <YStack>
                      <Text
                        fontSize="$4"
                        fontWeight="bold"
                        color="$textPrimary"
                      >
                        {selectedTimbre.label}
                      </Text>
                      <Text fontSize="$3" color="$textSecondary">
                        Click to change sound
                      </Text>
                    </YStack>
                  </XStack>
                  <ChevronLeft size={20} color="$grayText" rotate="180deg" />
                </Button>
              </YStack>
            </YStack>
          </ScrollView>

          <Button
            size="$5"
            bg="$accent"
            pressStyle={{ bg: "$accentPress" }}
            icon={<Mic color="white" />}
            onPress={() => setStep("session")}
          >
            <Text color="white" fontWeight="bold">
              Go to Record
            </Text>
          </Button>
        </>
      )}

      {step === "timbre-select" && (
        <>
          {renderHeader("Select Timbre")}
          <Text fontSize="$3" color="$textSecondary" textAlign="center" mb="$2">
            Listen to the samples and choose a timbre
          </Text>

          <Sheet.ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3" pb="$8">
              {TIMBRE_COLLECTION.map((item) => {
                const isSelected = selectedTimbre.id === item.id;
                const isPlaying = playingTimbreId === item.id;

                return (
                  <XStack
                    key={item.id}
                    bg={isSelected ? "$dark3" : "$surface"}
                    borderColor={isSelected ? "$accent" : "$border"}
                    borderWidth={1}
                    br="$4"
                    ai="center"
                    p="$3"
                    gap="$3"
                  >
                    <Button
                      size="$4"
                      circular
                      bg={isPlaying ? "$red9" : "$border"}
                      onPress={() => toggleTimbrePreview(item)}
                      icon={
                        isPlaying ? (
                          <Square size={16} fill="white" />
                        ) : (
                          <Play size={16} fill={isPlaying ? "white" : "none"} />
                        )
                      }
                    />

                    <Button
                      flex={1}
                      chromeless
                      h="100%"
                      jc="flex-start"
                      onPress={() => handleSelectTimbre(item)}
                    >
                      <YStack ai="flex-start">
                        <Text
                          fontSize="$4"
                          fontWeight="bold"
                          color={isSelected ? "white" : "$textPrimary"}
                        >
                          {item.label}
                        </Text>
                        <XStack ai="center" gap="$2">
                          {isPlaying && (
                            <Text fontSize="$3" color="$red9">
                              Playing...
                            </Text>
                          )}
                        </XStack>
                      </YStack>
                    </Button>

                    {isSelected && (
                      <View bg="$accent" p="$2" br="$10">
                        <Check size={16} color="white" />
                      </View>
                    )}
                  </XStack>
                );
              })}
            </YStack>
          </Sheet.ScrollView>
        </>
      )}

      {step === "session" && (
        <>
          {renderHeader("Recording Session")}
          <YStack flex={1} gap="$5">
            <YStack
              flex={1}
              bg="$surface"
              br="$6"
              ai="center"
              jc="center"
              gap="$5"
              overflow="hidden"
              borderWidth={recordingState === "recording" ? 8 : 0}
              borderColor={
                recordingState === "recording" && isBeatFlash
                  ? metronomeTick === 0
                    ? "$red10"
                    : "$accent"
                  : "transparent"
              }
              animation="quick"
            >
              {recordingState === "counting" && (
                <YStack ai="center" gap="$2" animation="quick">
                  <Text fontSize={80} fontWeight="900" color="$accent">
                    {countdown}
                  </Text>
                  <Text fontSize="$4" color="$textSecondary">
                    Get Ready...
                  </Text>
                </YStack>
              )}
              {recordingState === "recording" && (
                <YStack ai="center" gap="$4" w="100%" px="$6">
                  <EngagingMetronome bpm={targetBpm} active={true} />
                  <Text fontSize="$5" fontWeight="bold" color="$textPrimary">
                    Recording...
                  </Text>
                  <YStack
                    w="100%"
                    h={6}
                    bg="$border"
                    br="$10"
                    overflow="hidden"
                  >
                    <View
                      h="100%"
                      bg="$accent"
                      width={`${(timeLeft / calculateDuration()) * 100}%`}
                    />
                  </YStack>
                  <Text fontSize="$5" color="$textSecondary">
                    {formatMs(timeLeft)} left
                  </Text>
                </YStack>
              )}
              {recordingState === "idle" && (
                <YStack ai="center" gap="$4">
                  <View
                    w={80}
                    h={80}
                    br={40}
                    bg="$border"
                    ai="center"
                    jc="center"
                  >
                    <Mic size={40} color="#888" />
                  </View>
                  <Text color="$textSecondary" textAlign="center">
                    {targetBpm} BPM / {targetBars} Bars{"\n"}
                    Target: {selectedTimbre.label}
                  </Text>
                  {/* <Button onPress={loadSampleBeatbox} icon={<FileAudio/>}>Sample</Button> */}
                </YStack>
              )}
              {recordingState === "review" && (
                <YStack ai="center" gap="$4">
                  {generatedUri ? (
                    <Drum size={60} color="$accent" />
                  ) : (
                    <Check size={60} color="$accent" />
                  )}
                  <Text fontSize="$5" fontWeight="bold" color="$textPrimary">
                    {generatedUri
                      ? "New Sound Converted!"
                      : "Recording Complete"}
                  </Text>
                  <Button
                    icon={
                      isPlayingReview ? (
                        <Square size={16} />
                      ) : (
                        <Play size={16} />
                      )
                    }
                    onPress={() => toggleReviewPlay()}
                    chromeless
                  >
                    {isPlayingReview
                      ? "Stop Preview"
                      : generatedUri
                      ? "Play New Sound"
                      : "Play Original"}
                  </Button>
                </YStack>
              )}
            </YStack>

            <YStack gap="$3">
              {recordingState === "idle" ? (
                <Button
                  size="$5"
                  bg="$red9"
                  icon={<Circle fill="white" size={16} color="white" />}
                  onPress={startCountdown}
                >
                  <Text color="white" fontWeight="bold">
                    Start Recording
                  </Text>
                </Button>
              ) : recordingState === "recording" ? (
                <Button
                  size="$5"
                  bg="$grayText"
                  icon={<Square fill="white" size={16} />}
                  onPress={stopRecording}
                >
                  <Text color="white" fontWeight="bold">
                    Stop Now
                  </Text>
                </Button>
              ) : recordingState === "review" ? (
                <YStack gap="$3">
                  {!generatedUri ? (
                    <Button
                      size="$5"
                      bg="$accent"
                      icon={
                        isGenerating ? (
                          <Spinner color="white" />
                        ) : (
                          <Drum size={16} color="white" />
                        )
                      }
                      onPress={handleAiConvert}
                      disabled={isGenerating}
                    >
                      <Text color="white" fontWeight="bold">
                        {isGenerating ? "Converting..." : "Convert"}
                      </Text>
                    </Button>
                  ) : (
                    <Button
                      size="$5"
                      bg="$accent"
                      icon={<Check color="white" />}
                      onPress={confirmBeatbox}
                      disabled={isGenerating}
                    >
                      <Text color="white" fontWeight="bold">
                        Create Project
                      </Text>
                    </Button>
                  )}

                  <Button
                    bg="$surface"
                    borderColor="$border"
                    borderWidth={1}
                    icon={<RefreshCcw size={16} />}
                    onPress={handleRetake}
                    disabled={isGenerating}
                  >
                    Retake
                  </Button>
                </YStack>
              ) : (
                <Button size="$5" disabled bg="$border">
                  <Text color="$textSecondary">Preparing...</Text>
                </Button>
              )}
            </YStack>
          </YStack>
        </>
      )}
    </YStack>
  );
};

const formatMs = (ms: number) => {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
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
