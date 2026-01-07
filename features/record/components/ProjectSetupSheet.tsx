import React, { useState, useEffect } from "react";
import { Sheet, YStack, XStack, Text, Button } from "tamagui";
import { Mic, Music } from "@tamagui/lucide-icons";
import { TrackItem } from "@/services/TrackLibraryService";

import { BeatboxSetup } from "./BeatboxSetup";
import { PresetSetup } from "./PresetSetup";

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
  const [position, setPosition] = useState(0);
  const [mode, setMode] = useState<"select" | "beatbox" | "preset">("select");

  useEffect(() => {
    if (!open) {
      setMode("select");
    }
  }, [open]);

  const handleComplete = (track: TrackItem) => {
    onComplete(track);
  };

  return (
    <Sheet
      forceRemoveScrollEnabled={open}
      modal={true}
      open={open}
      onOpenChange={onOpenChange}
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

        {/* --- 1. Selection Mode --- */}
        {mode === "select" && (
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
              {/* Go to Beatbox */}
              <Button
                flex={1}
                h={220}
                fd="column"
                gap="$2"
                bg="$surface"
                borderColor="$border"
                borderWidth={1}
                pressStyle={{ bg: "$border", scale: 0.98 }}
                p="$3"
                br="$6"
                onPress={() => setMode("beatbox")}
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

              {/* Go to Preset */}
              <Button
                flex={1}
                h={220}
                fd="column"
                gap="$2"
                bg="$surface"
                borderColor="$border"
                borderWidth={1}
                pressStyle={{ bg: "$border", scale: 0.98 }}
                p="$3"
                br="$6"
                onPress={() => setMode("preset")}
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

        {/* --- 2. Beatbox Setup Mode --- */}
        {mode === "beatbox" && (
          <BeatboxSetup
            onBack={() => setMode("select")}
            onComplete={handleComplete}
          />
        )}

        {/* --- 3. Preset Setup Mode --- */}
        {mode === "preset" && (
          <PresetSetup
            onBack={() => setMode("select")}
            onComplete={handleComplete}
          />
        )}
      </Sheet.Frame>
    </Sheet>
  );
};
