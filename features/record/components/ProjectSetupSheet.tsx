import React, { useState, useEffect } from "react";
import {
  Sheet,
  YStack,
  XStack,
  Text,
  Button,
  Slider,
  Separator,
  ScrollView,
} from "tamagui";
import { Audio } from "expo-av";
import {
  Mic,
  Music,
  Play,
  Square,
  Check,
  ChevronLeft,
} from "@tamagui/lucide-icons";

import { useMetronome, calculatePresetParams } from "../hooks/useProjectSetup";
import { PresetSample, TrackItem } from "@/services/TrackLibraryService";

// [Data] Mock Data
const PRESET_SAMPLES: PresetSample[] = [
  {
    id: "1",
    title: "Basic Drum Kit",
    uri: require("@/assets/preset/sample1.wav"),
    originalBpm: 80,
    originalBars: 2,
  },
  {
    id: "2",
    title: "Lo-Fi HipHop",
    uri: require("@/assets/preset/sample2.wav"),
    originalBpm: 90,
    originalBars: 4,
  },
  {
    id: "3",
    title: "Acoustic Vibe",
    uri: require("@/assets/preset/sample3.wav"),
    originalBpm: 90,
    originalBars: 4,
  },
];

interface ProjectSetupSheetProps {
  open: boolean;
  onComplete: (track: TrackItem) => void;
  onOpenChange?: (open: boolean) => void;
}

export const ProjectSetupSheet = ({
  open,
  onComplete,
  onOpenChange,
}: ProjectSetupSheetProps) => {
  const [step, setStep] = useState<
    "select" | "beatbox" | "preset-config" | "preset-list"
  >("select");
  const [position, setPosition] = useState(0);

  const [selectedPreset, setSelectedPreset] = useState<PresetSample | null>(
    null
  );
  const [targetBpm, setTargetBpm] = useState(100);
  const [targetBars, setTargetBars] = useState(4);
  const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const { isMetronomePlaying, toggleMetronome, isTicking } =
    useMetronome(targetBpm);

  useEffect(() => {
    if (!open) stopAllAudio();
    return () => {
      stopAllAudio();
    };
  }, [open]);

  const stopAllAudio = async () => {
    if (previewSound) {
      try {
        await previewSound.stopAsync();
        await previewSound.unloadAsync();
      } catch (e) {}
      setPreviewSound(null);
      setIsPreviewing(false);
    }
    if (isMetronomePlaying) toggleMetronome();
  };

  const togglePreview = async () => {
    if (isPreviewing) {
      await previewSound?.stopAsync();
      setIsPreviewing(false);
      return;
    }
    if (!selectedPreset) return;

    try {
      if (previewSound) await previewSound.unloadAsync();
      const { rate } = calculatePresetParams(
        selectedPreset.originalBpm,
        targetBpm,
        targetBars
      );
      const { sound } = await Audio.Sound.createAsync(selectedPreset.uri, {
        shouldPlay: true,
        isLooping: true,
      });
      await sound.setRateAsync(rate, true);
      setPreviewSound(sound);
      setIsPreviewing(true);
    } catch (e) {
      console.error("Preview failed", e);
    }
  };

  const confirmPreset = () => {
    if (!selectedPreset) return;
    const { rate, totalDurationMillis, displayDuration } =
      calculatePresetParams(selectedPreset.originalBpm, targetBpm, targetBars);
    const newTrack: TrackItem = {
      id: Date.now().toString(),
      uri: selectedPreset.uri,
      title: `${selectedPreset.title} (${targetBpm} BPM)`,
      duration: displayDuration,
      durationMillis: totalDurationMillis,
      createdAt: Date.now(),
      playbackSettings: {
        type: "preset",
        originalBpm: selectedPreset.originalBpm,
        targetBpm: targetBpm,
        targetBars: targetBars,
        rate: rate,
        loopCount: 0,
      },
    };
    stopAllAudio();
    onComplete(newTrack);
  };

  const handleClose = () => {
    stopAllAudio();
    if (step === "preset-list") {
      setStep("preset-config");
      return;
    }
    setStep("select");
  };

  const renderHeader = (title: string, showBack: boolean = true) => (
    <XStack
      ai="center"
      jc="center"
      height="$4"
      mb="$4"
      width="100%"
      position="relative"
    >
      {showBack && (
        <Button
          size="$3"
          chromeless
          icon={<ChevronLeft size={28} color="$textSecondary" />}
          onPress={handleClose}
          position="absolute"
          left={-10}
          zIndex={10}
          p="$2"
        />
      )}
      <Text
        fontSize="$4"
        fontWeight="700"
        color="$textPrimary"
        textAlign="center"
      >
        {title}
      </Text>
    </XStack>
  );

  return (
    <Sheet
      forceRemoveScrollEnabled={open}
      modal={true}
      open={open}
      onOpenChange={(val) => {
        if (!val) stopAllAudio();
        onOpenChange?.(val);
      }}
      snapPoints={[85]}
      position={position}
      onPositionChange={setPosition}
      dismissOnSnapToBottom={false}
      animation="medium"
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame
        padding="$5"
        bg="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <Sheet.Handle bg="$border" />

        {/* STEP 1: Main Selection */}
        {step === "select" && (
          <YStack flex={1} gap="$6" ai="center" jc="center" pb="$10">
            <YStack ai="center" gap="$2">
              <Text fontSize="$6" fontWeight="800" color="$textPrimary">
                Start Project
              </Text>
              <Text fontSize="$4" color="$textSecondary" textAlign="center">
                How would you like to start your beat?
              </Text>
            </YStack>

            <XStack gap="$4" width="100%" jc="center">
              <Button
                flex={1}
                h={220}
                fd="column"
                gap="$2"
                bg="$surface"
                borderColor="$border"
                borderWidth={1}
                pressStyle={{ bg: "$border", scale: 0.98 }}
                onPress={() => {
                  setStep("beatbox");
                  setTargetBpm(100);
                }}
                p="$3"
                br="$6"
              >
                <YStack bg="$border" p="$4" br="$10" mb="$1">
                  <Mic size={36} color="white" />
                </YStack>

                <YStack ai="center" gap="$1">
                  <Text fontSize="$4" fontWeight="800" color="$accent">
                    Beatbox
                  </Text>
                  <Text fontSize="$3" color="$textSecondary" textAlign="center">
                    Record your own rhythm{"\n"}using voice
                  </Text>
                </YStack>
              </Button>

              {/* Preset Button */}
              <Button
                flex={1}
                h={220}
                fd="column"
                gap="$2"
                bg="$surface"
                borderColor="$border"
                borderWidth={1}
                pressStyle={{ bg: "$border", scale: 0.98 }}
                onPress={() => {
                  if (selectedPreset) setStep("preset-config");
                  else setStep("preset-list");
                }}
                p="$3"
                br="$6"
              >
                <YStack bg="$border" p="$4" br="$10" mb="$1">
                  <Music size={36} color="white" />
                </YStack>

                <YStack ai="center" gap="$1">
                  <Text fontSize="$4" fontWeight="800" color="$accent">
                    Preset
                  </Text>
                  <Text fontSize="$3" color="$textSecondary" textAlign="center">
                    Start with a sample{"\n"}and customize it
                  </Text>
                </YStack>
              </Button>
            </XStack>
          </YStack>
        )}

        {/* STEP 2: Beatbox */}
        {step === "beatbox" && (
          <YStack flex={1} gap="$5">
            {renderHeader("Record Beatbox")}

            <YStack
              bg="$surface"
              p="$6"
              br="$6"
              gap="$5"
              borderColor={isTicking ? "$accent" : "transparent"}
              borderWidth={5}
            >
              <YStack gap="$3">
                <XStack jc="space-between" ai="center">
                  <Text fontSize="$4" color="$textSecondary" fontWeight="600">
                    Tempo
                  </Text>
                  <Text
                    fontSize="$6"
                    color="$accent"
                    fontWeight="800"
                    fontVariant={["tabular-nums"]}
                  >
                    {targetBpm}{" "}
                    <Text fontSize="$3" color="$grayText">
                      BPM
                    </Text>
                  </Text>
                </XStack>
                <Slider
                  value={[targetBpm]}
                  min={60}
                  max={180}
                  step={1}
                  onValueChange={(val) => setTargetBpm(val[0])}
                >
                  <Slider.Track bg="$border" height={8}>
                    <Slider.TrackActive bg="$accent" />
                  </Slider.Track>
                  <Slider.Thumb
                    index={0}
                    circular
                    size="$3"
                    bg="$light1"
                    elevation="$2"
                  />
                </Slider>
              </YStack>
              <Separator borderColor="$border" />

              <Button
                bg={isMetronomePlaying ? "$accent" : "$border"}
                pressStyle={{ opacity: 0.9 }}
                onPress={toggleMetronome}
                icon={
                  isMetronomePlaying ? (
                    <Square size={20} color="white" />
                  ) : (
                    <Play size={20} color="white" />
                  )
                }
                br="$10"
                h="$5"
                px="$5"
              >
                <Text color="white" fontWeight="700" fontSize="$4">
                  {isMetronomePlaying ? "Stop Metronome" : "Start Metronome"}
                </Text>
              </Button>
            </YStack>

            <YStack
              f={1}
              ai="center"
              jc="center"
              bg="$background"
              borderColor="$border"
              borderWidth={2}
              borderStyle="dashed"
              br="$6"
              gap="$3"
            >
              <YStack bg="$border" p="$4" br="$10">
                <Mic size={40} color="#888" />
              </YStack>
              <Text color="$textSecondary" fontSize="$4">
                Tap record button to start
              </Text>
            </YStack>
            <Button
              size="$5"
              bg="$accent"
              pressStyle={{ bg: "$accentPress" }}
              disabled
              icon={<Check color="white" />}
            >
              <Text color="white" fontWeight="bold">
                Convert
              </Text>
            </Button>
          </YStack>
        )}

        {/* STEP 3-A: Preset List Selection */}
        {step === "preset-list" && (
          <YStack flex={1} gap="$5">
            {renderHeader("Select Preset")}

            <Sheet.ScrollView showsVerticalScrollIndicator={false}>
              <YStack gap="$3" pb="$8">
                {PRESET_SAMPLES.map((item) => {
                  const isSelected = selectedPreset?.id === item.id;
                  return (
                    <Button
                      key={item.id}
                      onPress={() => {
                        setSelectedPreset(item);
                        setStep("preset-config");
                      }}
                      bg={isSelected ? "$border" : "$surface"}
                      borderColor={isSelected ? "$accent" : "$border"}
                      borderWidth={1}
                      jc="space-between"
                      minHeight="$6"
                      pressStyle={{ bg: "$border" }}
                      px="$4"
                      py="$3"
                    >
                      <XStack gap="$3" ai="center" flex={1}>
                        <Music
                          size={20}
                          color={isSelected ? "$accent" : "$grayText"}
                        />
                        <YStack flex={1}>
                          <Text
                            color={isSelected ? "$textPrimary" : "$grayText"}
                            fontWeight={isSelected ? "bold" : "normal"}
                            fontSize="$4"
                          >
                            {item.title}
                          </Text>
                        </YStack>
                      </XStack>
                      <XStack gap="$3" ai="center">
                        <Text fontSize="$3" color="$grayText">
                          {item.originalBpm} BPM
                        </Text>
                        {isSelected && <Check size={18} color="$accent" />}
                      </XStack>
                    </Button>
                  );
                })}
              </YStack>
            </Sheet.ScrollView>
          </YStack>
        )}

        {/* STEP 3-B: Preset Configuration */}
        {step === "preset-config" && selectedPreset && (
          <YStack flex={1} gap="$5">
            {renderHeader("Configure Preset")}

            <Button
              onPress={() => setStep("preset-list")}
              bg="$surface"
              borderColor="$border"
              borderWidth={1}
              jc="space-between"
              height="$5"
              px="$4"
              mb="$2"
            >
              <XStack gap="$3" ai="center">
                <Music size={18} color="$accent" />
                <Text color="$textPrimary" fontSize="$4" fontWeight="600">
                  {selectedPreset.title}
                </Text>
              </XStack>
              <Text color="$accent" fontSize="$4">
                Change
              </Text>
            </Button>

            <YStack flex={1} gap="$5" justifyContent="space-between">
              <YStack gap="$5" p="$5" bg="$surface" br="$5">
                {/* Sliders... */}
                <YStack gap="$3">
                  <XStack jc="space-between" ai="flex-end">
                    <Text fontSize="$3" color="$textSecondary" fontWeight="600">
                      Tempo
                    </Text>
                    <Text fontSize="$5" color="$accent" fontWeight="800">
                      {targetBpm}{" "}
                      <Text fontSize="$3" color="$grayText">
                        BPM
                      </Text>
                    </Text>
                  </XStack>
                  <Slider
                    value={[targetBpm]}
                    min={60}
                    max={180}
                    step={1}
                    onValueChange={(v) => {
                      setTargetBpm(v[0]);
                      if (isPreviewing) togglePreview();
                    }}
                  >
                    <Slider.Track bg="$border" height={6}>
                      <Slider.TrackActive bg="$accent" />
                    </Slider.Track>
                    <Slider.Thumb index={0} circular size="$2" bg="$light1" />
                  </Slider>
                </YStack>

                <YStack gap="$3">
                  <XStack jc="space-between" ai="flex-end">
                    <Text fontSize="$3" color="$textSecondary" fontWeight="600">
                      Duration
                    </Text>
                    <Text fontSize="$5" color="$accent" fontWeight="800">
                      {targetBars}{" "}
                      <Text fontSize="$3" color="$grayText">
                        Bars
                      </Text>
                    </Text>
                  </XStack>
                  <Slider
                    value={[targetBars]}
                    min={2}
                    max={32}
                    step={2}
                    onValueChange={(v) => {
                      setTargetBars(v[0]);
                      if (isPreviewing) togglePreview();
                    }}
                  >
                    <Slider.Track bg="$border" height={6}>
                      <Slider.TrackActive bg="$accent" />
                    </Slider.Track>
                    <Slider.Thumb index={0} circular size="$2" bg="$light1" />
                  </Slider>
                </YStack>

                <Button
                  bg={isPreviewing ? "$red9" : "$accent"}
                  icon={
                    isPreviewing ? (
                      <Square size={18} color="white" />
                    ) : (
                      <Play size={18} color="white" />
                    )
                  }
                  onPress={togglePreview}
                  br="$10"
                  pressStyle={{ opacity: 0.9 }}
                  px="$4"
                >
                  <Text color="white" fontWeight="600">
                    {isPreviewing ? "Stop Preview" : "Preview Beat"}
                  </Text>
                </Button>
              </YStack>

              <Button
                size="$5"
                bg="$accent"
                pressStyle={{ bg: "$accentPress" }}
                icon={<Check color="white" />}
                onPress={confirmPreset}
                px="$4"
              >
                <Text color="white" fontWeight="bold">
                  Start with this Beat
                </Text>
              </Button>
            </YStack>
          </YStack>
        )}
      </Sheet.Frame>
    </Sheet>
  );
};
