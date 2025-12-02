import {
  Mic,
  MoreVertical,
  Music,
  Play,
  Pause,
  Trash2,
  Share,
  VolumeX,
  X,
} from "@tamagui/lucide-icons";
import React, { useState, useMemo } from "react";
import {
  Button,
  Circle,
  ScrollView,
  Text,
  XStack,
  YStack,
  ZStack,
  Spacer,
} from "tamagui";

export interface Track {
  id: string;
  title: string;
  duration: string;
}

interface TrackListProps {
  tracks: Track[];
  onStartRecording: () => void;
}

export const TrackList = ({ tracks, onStartRecording }: TrackListProps) => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

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

  return (
    <ZStack flex={1}>
      <ScrollView flex={1} p="$4" mb={80} showsVerticalScrollIndicator={false}>
        <YStack gap="$3" pb={100}>
          <Text color="$grayText" mb="$2" ml="$2">
            Layers ({tracks.length})
          </Text>
          {tracks.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              onOpenMenu={() => setSelectedTrack(track)}
            />
          ))}
        </YStack>
      </ScrollView>

      {selectedTrack && (
        <CustomActionSheet
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
        />
      )}
    </ZStack>
  );
};

// --- [개별 트랙 아이템] ---
const TrackItem = ({
  track,
  onOpenMenu,
}: {
  track: Track;
  onOpenMenu: () => void;
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) setIsPlaying(false);
  };

  return (
    <ZStack
      height={90}
      borderRadius="$4"
      onPress={toggleMute}
      overflow="hidden"
    >
      <YStack
        fullscreen
        bg="$dark2"
        p="$3"
        justifyContent="space-between"
        opacity={isMuted ? 0.3 : 1}
      >
        <XStack jc="space-between" ai="center">
          <Text color="$textPrimary" fontWeight="bold" fontSize="$4">
            {track.title}
          </Text>
          <Text color="$grayText" fontSize="$2">
            {track.duration}
          </Text>
        </XStack>

        <XStack ai="center" gap="$3">
          <Circle
            size="$3"
            bg={isPlaying ? "$accent" : "$grayText"}
            onPress={(e) => {
              e.stopPropagation();
              if (!isMuted) setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? (
              <Pause size={14} color="white" fill="white" />
            ) : (
              <Play size={14} color="black" fill="black" ml={2} />
            )}
          </Circle>

          <WaveformVisualizer color={isPlaying ? "$accent" : "$grayText"} />

          <Button
            size="$3"
            circular
            chromeless
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu();
            }}
          >
            <MoreVertical size={20} color="$grayText" />
          </Button>
        </XStack>
      </YStack>

      {isMuted && (
        <YStack
          fullscreen
          ai="center"
          jc="center"
          bg="rgba(0,0,0,0.3)"
          pointerEvents="none"
        >
          <XStack
            ai="center"
            gap="$2"
            bg="$dark1"
            px="$3"
            py="$2"
            borderRadius="$10"
          >
            <Text color="$textPrimary" fontWeight="bold">
              Muted
            </Text>
            <VolumeX size={16} color="white" />
          </XStack>
        </YStack>
      )}
    </ZStack>
  );
};

const WaveformVisualizer = ({ color }: { color: string }) => {
  const bars = useMemo(
    () =>
      Array.from({ length: 25 }).map(() => Math.floor(Math.random() * 20) + 5),
    []
  );
  return (
    <XStack flex={1} ai="center" gap={2} height={30} overflow="hidden">
      {bars.map((height, i) => (
        <YStack
          key={i}
          width={3}
          height={height}
          bg={color}
          borderRadius={2}
          opacity={0.7}
        />
      ))}
    </XStack>
  );
};
const CustomActionSheet = ({
  track,
  onClose,
}: {
  track: Track;
  onClose: () => void;
}) => {
  return (
    <ZStack fullscreen>
      <YStack
        fullscreen
        bg="rgba(0,0,0,0.6)"
        onPress={onClose}
        animation="quick"
        enterStyle={{ opacity: 0 }}
      />
      <YStack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bg="$dark2"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
        p="$4"
        gap="$2"
        pb={130}
        animation="bouncy"
        enterStyle={{ y: 300, opacity: 0 }}
      >
        <XStack jc="space-between" ai="center" mb="$2">
          <YStack>
            <Text color="$textPrimary" fontSize="$5" fontWeight="bold">
              {track.title}
            </Text>
            <Text color="$grayText" fontSize="$3">
              Select an action
            </Text>
          </YStack>
          <Button size="$3" circular chromeless onPress={onClose}>
            <X size={20} color="$grayText" />
          </Button>
        </XStack>

        <ActionButton
          icon={Share}
          label="Share Track"
          onPress={() => {
            console.log("Share");
            onClose();
          }}
        />

        <Spacer size="$2" />

        <ActionButton
          icon={Trash2}
          label="Delete Track"
          isDestructive
          onPress={() => {
            console.log("Delete");
            onClose();
          }}
        />
      </YStack>
    </ZStack>
  );
};
const ActionButton = ({ icon: Icon, label, isDestructive, onPress }: any) => (
  <Button
    size="$6"
    bg="$dark1"
    jc="flex-start"
    borderRadius="$4"
    onPress={onPress}
    pressStyle={{ bg: "$dark3" }}
    icon={<Icon size={22} color={isDestructive ? "$red10" : "$grayText"} />}
  >
    <Text
      color={isDestructive ? "$red10" : "$textPrimary"}
      fontSize="$4"
      fontWeight="600"
    >
      {label}
    </Text>
  </Button>
);
