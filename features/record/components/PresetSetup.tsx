import React, { useState, useEffect } from "react";
import {
  YStack,
  XStack,
  Text,
  Button,
  Slider,
  ScrollView,
  Sheet,
} from "tamagui";
import { Audio } from "expo-av";
import {
  Music,
  Play,
  Square,
  Check,
  ChevronLeft,
  RotateCcw,
} from "@tamagui/lucide-icons";
import { PresetSample, TrackItem } from "@/services/TrackLibraryService";
import { calculatePresetParams } from "../hooks/useProjectSetup";

const PRESET_SAMPLES: PresetSample[] = [
  {
    id: "1",
    title: "Bar Band Basic 05",
    uri: require("@/assets/preset/bar_band_basic_drumset_05.wav"),
    originalBpm: 120,
    originalBars: 1,
  },
  {
    id: "2",
    title: "South Beach Beat",
    uri: require("@/assets/preset/south_beach_beat.wav"),
    originalBpm: 120,
    originalBars: 1,
  },
  {
    id: "3",
    title: "Solid 70s 01",
    uri: require("@/assets/preset/solid_70s_drumset_01.wav"),
    originalBpm: 120,
    originalBars: 1,
  },
  {
    id: "4",
    title: "Funked Out Fill 03",
    uri: require("@/assets/preset/funked_out_fill_03.wav"),
    originalBpm: 120,
    originalBars: 1,
  },
  {
    id: "5",
    title: "Funked Out 01",
    uri: require("@/assets/preset/funked_out_drumset_01.wav"),
    originalBpm: 120,
    originalBars: 1,
  },
  {
    id: "6",
    title: "Bar Band Basic 01",
    uri: require("@/assets/preset/bar_band_basic_drumset_01.wav"),
    originalBpm: 120,
    originalBars: 1,
  },
  {
    id: "7",
    title: "Slippery Break",
    uri: require("@/assets/preset/slippery_break.wav"),
    originalBpm: 120,
    originalBars: 1,
  },
  {
    id: "8",
    title: "Jam Band Basic 03",
    uri: require("@/assets/preset/jam_band_basic_drumset_03.wav"),
    originalBpm: 120,
    originalBars: 1,
  },
  {
    id: "9",
    title: "Essential Drumset 01",
    uri: require("@/assets/preset/essential_drumset_01.wav"),
    originalBpm: 120,
    originalBars: 1,
  },
  {
    id: "10",
    title: "Headbop Drumset 01",
    uri: require("@/assets/preset/headbop_drumset_01.wav"),
    originalBpm: 120,
    originalBars: 1,
  },
];

interface PresetSetupProps {
  onBack: () => void;
  onComplete: (track: TrackItem) => void;
}

export const PresetSetup = ({ onBack, onComplete }: PresetSetupProps) => {
  const [step, setStep] = useState<"list" | "config">("list");
  const [selectedPreset, setSelectedPreset] = useState<PresetSample | null>(
    null
  );

  const [targetBpm, setTargetBpm] = useState(120);

  // 마디 수 초기값 (4마디 기본)
  const [targetBars, setTargetBars] = useState(4);

  const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = async () => {
    if (previewSound) {
      try {
        await previewSound.stopAsync();
        await previewSound.unloadAsync();
      } catch (e) {}
      setPreviewSound(null);
      setIsPreviewing(false);
    }
  };

  const togglePreview = async () => {
    if (isPreviewing) {
      await stopAudio();
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
      console.error(e);
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
    stopAudio();
    onComplete(newTrack);
  };

  const handleBarsChange = async (bars: number) => {
    setTargetBars(bars);
    if (isPreviewing) {
      await stopAudio();
    }
  };

  const handleBack = () => {
    stopAudio();
    if (step === "config") {
      setStep("list");
    } else {
      onBack();
    }
  };

  return (
    <YStack flex={1} gap="$5">
      {/* Header */}
      <XStack ai="center" jc="center" h="$4" mb="$4" w="100%" pos="relative">
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
          {step === "list" ? "Select Preset" : "Configure Preset"}
        </Text>
      </XStack>

      {/* Preset List */}
      {step === "list" && (
        <Sheet.ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 200 }}
        >
          <YStack gap="$3">
            {PRESET_SAMPLES.map((item) => {
              const isSelected = selectedPreset?.id === item.id;
              return (
                <Button
                  key={item.id}
                  onPress={() => {
                    setSelectedPreset(item);
                    setStep("config");
                  }}
                  bg={isSelected ? "$border" : "$surface"}
                  borderColor={isSelected ? "$accent" : "$border"}
                  borderWidth={1}
                  jc="space-between"
                  minHeight="$6"
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
      )}

      {/* Preset Config */}
      {step === "config" && selectedPreset && (
        <YStack flex={1} gap="$5" justifyContent="space-between">
          <YStack gap="$5" p="$5" bg="$surface" br="$5">
            {/* BPM Slider */}
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

            {/* Duration Buttons (Modified) */}
            <YStack gap="$3">
              <XStack jc="space-between" ai="flex-end">
                <Text fontSize="$3" color="$textSecondary" fontWeight="600">
                  Duration
                </Text>
              </XStack>

              <XStack gap="$3">
                {[4, 8].map((bars) => {
                  const isActive = targetBars === bars;
                  return (
                    <Button
                      key={bars}
                      flex={1}
                      onPress={() => handleBarsChange(bars)}
                      bg={isActive ? "$accent" : "$surface"}
                      borderColor={isActive ? "$accent" : "$border"}
                      borderWidth={1}
                    >
                      <Text
                        color={isActive ? "white" : "$textSecondary"}
                        fontWeight={isActive ? "bold" : "normal"}
                      >
                        {bars} Bars
                      </Text>
                    </Button>
                  );
                })}
              </XStack>
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
              px="$4"
              mt="$2"
            >
              <Text color="white" fontWeight="600">
                {isPreviewing ? "Stop Preview" : "Preview Beat"}
              </Text>
            </Button>
          </YStack>

          <YStack gap="$3" pb="$6">
            <Button
              size="$5"
              bg="$accent"
              icon={<Check color="white" />}
              onPress={confirmPreset}
              px="$4"
            >
              <Text color="white" fontWeight="bold">
                Start with this Preset
              </Text>
            </Button>

            <Button
              size="$4"
              chromeless
              icon={<RotateCcw size={16} color="$textSecondary" />}
              onPress={handleBack}
            >
              <Text color="$textSecondary">Choose Different Preset</Text>
            </Button>
          </YStack>
        </YStack>
      )}
    </YStack>
  );
};
