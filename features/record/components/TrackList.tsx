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
  Volume2,
} from "@tamagui/lucide-icons";
import React, { useState, useMemo, useEffect } from "react";
import { Audio } from "expo-av";
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
import { getSmartUri } from "@/utils/pathUtils";

export interface Track {
  id: string;
  title: string;
  duration: string;
  uri?: string;
  isMuted?: boolean;
}

interface TrackListProps {
  tracks: Track[];
  onStartRecording: () => void;
  onDeleteTrack: (track: Track) => void;
  onToggleMute?: (trackId: string) => void;
}

export const TrackList = ({
  tracks,
  onStartRecording,
  onDeleteTrack,
  onToggleMute,
}: TrackListProps) => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const handlePlay = async (track: Track) => {
    const playableUri = getSmartUri(track.uri);
    if (!playableUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      if (playingId === track.id) {
        setPlayingId(null);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: playableUri },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          newSound.unloadAsync();
          setSound(null);
        }
      });

      setSound(newSound);
      setPlayingId(track.id);
    } catch (error) {
      console.error("Track playback failed", error);
    }
  };

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
              isPlaying={playingId === track.id}
              onPlay={() => handlePlay(track)}
              onToggleMute={() => onToggleMute?.(track.id)}
            />
          ))}
        </YStack>
      </ScrollView>

      {selectedTrack && (
        <CustomActionSheet
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
          onDelete={() => {
            onDeleteTrack(selectedTrack);
            setSelectedTrack(null);
          }}
        />
      )}
    </ZStack>
  );
};

// --- [개별 트랙 아이템] ---
const TrackItem = ({
  track,
  onOpenMenu,
  isPlaying,
  onPlay,
  onToggleMute,
}: {
  track: Track;
  onOpenMenu: () => void;
  isPlaying: boolean;
  onPlay: () => void;
  onToggleMute: () => void;
}) => {
  const isMuted = track.isMuted ?? false;

  return (
    <ZStack
      height={90}
      borderRadius="$4"
      onPress={onToggleMute}
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
          <Text
            color="white"
            fontWeight="bold"
            fontSize="$4"
            textDecorationLine={isMuted ? "line-through" : "none"}
          >
            {track.title}
          </Text>
          <Text color="$grayText" fontSize="$3">
            {track.duration}
          </Text>
        </XStack>

        <XStack ai="center" gap="$3">
          <Circle
            size="$3"
            bg={isPlaying ? "$accent" : "$grayText"}
            onPress={(e) => {
              e.stopPropagation();
              if (!isMuted) onPlay();
            }}
          >
            {isPlaying ? (
              <Pause size={14} color="white" fill="white" />
            ) : (
              <Play size={14} color="black" fill="black" ml={2} />
            )}
          </Circle>

          <WaveformVisualizer color={isPlaying ? "$accent" : "$grayText"} />

          {isMuted ? (
            <VolumeX size={20} color="$grayText" />
          ) : (
            <Volume2 size={20} color="$grayText" />
          )}

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
  onDelete,
}: {
  track: Track;
  onClose: () => void;
  onDelete: () => void;
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
            onDelete();
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
