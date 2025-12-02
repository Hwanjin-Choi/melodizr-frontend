import { Mic, MoreVertical, Music, Play } from "@tamagui/lucide-icons";
import React from "react";
import { Button, Circle, ScrollView, Text, XStack, YStack } from "tamagui";

export interface Track {
  id: string;
  title: string;
  duration: string;
}

interface TrackListProps {
  tracks: Track[]; // Receive track list from parent
  onStartRecording: () => void; // Recording button action when the screen is empty
}

export const TrackList = ({ tracks, onStartRecording }: TrackListProps) => {
  // [Case 1] When there are no tracks (Empty State)
  if (tracks.length === 0) {
    return (
      <YStack
        flex={1}
        ai="center"
        jc="center"
        px="$6"
        gap="$6"
        opacity={0.8}
        mt="$10"
      >
        <Circle size={80} bg="$dark2" ai="center" jc="center">
          <Music size={40} color="$grayText" />
        </Circle>

        <YStack ai="center" gap="$2">
          <Text
            color="$textPrimary"
            fontSize="$6"
            fontWeight="bold"
            textAlign="center"
          >
            No Tracks Yet
          </Text>
          <Text color="$grayText" fontSize="$4" textAlign="center">
            Start your first project by recording your voice or instrument.
          </Text>
        </YStack>

        <Button
          size="$5"
          bg="$accent"
          color="white"
          icon={<Mic size={20} />}
          onPress={onStartRecording}
          pressStyle={{ bg: "$accentPress" }}
        >
          Start Recording
        </Button>
      </YStack>
    );
  }

  // [Case 2] When there are tracks (List)
  return (
    <ScrollView flex={1} p="$4" mb={80}>
      <YStack gap="$3">
        <Text color="$grayText" mb="$2">
          Layers ({tracks.length})
        </Text>
        {tracks.map((track) => (
          <TrackItem
            key={track.id}
            title={track.title}
            duration={track.duration}
          />
        ))}
      </YStack>
    </ScrollView>
  );
};

// Individual track item
const TrackItem = ({
  title,
  duration,
}: {
  title: string;
  duration: string;
}) => (
  <XStack bg="$dark2" p="$4" borderRadius="$4" ai="center" jc="space-between">
    <XStack ai="center" gap="$3">
      <Circle size="$3" bg="$grayText">
        <Play size={12} color="black" fill="black" />
      </Circle>
      <YStack
        height={24}
        width={120}
        bg="$accent"
        opacity={0.3}
        borderRadius="$2"
      />
      <Text color="$textPrimary" fontWeight="bold" fontSize="$3">
        {title}
      </Text>
    </XStack>
    <MoreVertical size={20} color="gray" />
  </XStack>
);
