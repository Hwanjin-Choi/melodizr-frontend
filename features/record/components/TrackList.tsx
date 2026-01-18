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
  Pencil,
  Check,
} from "@tamagui/lucide-icons";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Audio } from "expo-av";
import * as Sharing from "expo-sharing";
import {
  Button,
  Circle,
  ScrollView,
  Text,
  XStack,
  YStack,
  ZStack,
  Spacer,
  Input,
  View,
} from "tamagui";
import { getSmartUri } from "@/utils/pathUtils";
import { FileWaveformVisualizer } from "./FileWaveformVisualizer";

interface PlaybackSettings {
  type: "preset";
  originalBpm: number;
  targetBpm: number;
  targetBars: number;
  rate: number;
  loopCount: number;
}

export interface Track {
  id: string;
  title: string;
  duration: string;
  uri?: string | number;
  isMuted?: boolean;
  durationMillis?: number;
  playbackSettings?: PlaybackSettings;
}

interface TrackListProps {
  tracks: Track[];
  onStartRecording: () => void;
  onDeleteTrack: (track: Track) => void;
  onToggleMute?: (trackId: string) => void;
  onRenameTrack?: (trackId: string, newTitle: string) => void;
}

export const TrackList = ({
  tracks,
  onStartRecording,
  onDeleteTrack,
  onToggleMute,
  onRenameTrack,
}: TrackListProps) => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const playTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      cleanupSound();
    };
  }, []);

  const cleanupSound = async () => {
    if (playTimeout.current) {
      clearTimeout(playTimeout.current);
      playTimeout.current = null;
    }
    // 즉시 UI 상태를 초기화하여 딜레이 방지
    setPlayingId(null);

    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (e) {
        // ignore error
      }
      setSound(null);
    }
  };

  const handlePlay = async (track: Track) => {
    const playableUri = getSmartUri(track.uri);
    if (!playableUri) return;

    try {
      // 1. 같은 트랙을 누른 경우 (일시정지)
      if (playingId === track.id) {
        // cleanupSound가 UI 업데이트와 정리를 모두 수행
        await cleanupSound();
        return;
      }

      // 2. 다른 트랙을 누른 경우 (기존 트랙 정지)
      if (sound) {
        await cleanupSound();
      }

      const source =
        typeof playableUri === "number" ? playableUri : { uri: playableUri };

      const isPreset = track.playbackSettings?.type === "preset";

      const { sound: newSound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
        isLooping: isPreset,
      });

      if (track.playbackSettings?.rate) {
        await newSound.setRateAsync(track.playbackSettings.rate, true);
      }

      setSound(newSound);
      setPlayingId(track.id);

      // 3. 재생 종료 로직 설정
      if (isPreset && track.durationMillis) {
        // [수정] 프리셋 종료 타이머
        playTimeout.current = setTimeout(async () => {
          // [핵심] UI 먼저 업데이트! (딜레이 제거)
          setPlayingId(null);

          try {
            await newSound.stopAsync();
            await newSound.unloadAsync();
          } catch (e) {
            console.error("Error unloading preset sound", e);
          }
          setSound(null);
        }, track.durationMillis);
      } else {
        // [수정] 일반 트랙 종료 리스너
        newSound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            // [핵심] UI 먼저 업데이트!
            setPlayingId(null);

            try {
              await newSound.unloadAsync();
            } catch (e) {
              console.error("Error unloading sound", e);
            }
            setSound(null);
          }
        });
      }
    } catch (error) {
      console.error("Track playback failed", error);
      cleanupSound();
    }
  };

  const handleRenameSubmit = (trackId: string, newTitle: string) => {
    if (onRenameTrack) {
      onRenameTrack(trackId, newTitle);
    }
    setEditingId(null);
  };

  const handleShareTrack = async (track: Track) => {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      alert("Sharing is not available on this device");
      return;
    }
    const uri = getSmartUri(track.uri);
    if (!uri) return;

    if (typeof uri === "number") {
      alert("Preset tracks cannot be shared directly yet.");
      return;
    }

    try {
      await Sharing.shareAsync(uri, {
        dialogTitle: `Share ${track.title}`,
        mimeType: "audio/x-m4a",
        UTI: "public.audio",
      });
    } catch (error) {
      console.error("Error sharing track:", error);
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
              isEditing={editingId === track.id}
              onRenameSubmit={(newTitle) =>
                handleRenameSubmit(track.id, newTitle)
              }
              onCancelEdit={() => setEditingId(null)}
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
          onStartRename={() => {
            setEditingId(selectedTrack.id);
            setSelectedTrack(null);
          }}
          onShare={() => {
            handleShareTrack(selectedTrack);
            setSelectedTrack(null);
          }}
        />
      )}
    </ZStack>
  );
};

const TrackItem = ({
  track,
  onOpenMenu,
  isPlaying,
  onPlay,
  onToggleMute,
  isEditing,
  onRenameSubmit,
  onCancelEdit,
}: {
  track: Track;
  onOpenMenu: () => void;
  isPlaying: boolean;
  onPlay: () => void;
  onToggleMute: () => void;
  isEditing: boolean;
  onRenameSubmit: (text: string) => void;
  onCancelEdit: () => void;
}) => {
  const isMuted = track.isMuted ?? false;
  const [editTitle, setEditTitle] = useState(track.title);

  useEffect(() => {
    if (isEditing) {
      setEditTitle(track.title);
    }
  }, [isEditing, track.title]);

  return (
    <ZStack
      height={90}
      borderRadius="$4"
      onPress={isEditing ? undefined : onToggleMute}
      overflow="hidden"
    >
      <YStack
        fullscreen
        bg="$dark2"
        p="$3"
        justifyContent="space-between"
        opacity={isMuted && !isEditing ? 0.3 : 1}
      >
        <XStack jc="space-between" ai="center" height={30}>
          {isEditing ? (
            <XStack f={1} ai="center" gap="$2">
              <Input
                f={1}
                size="$2"
                value={editTitle}
                onChangeText={setEditTitle}
                autoFocus
                onSubmitEditing={() => onRenameSubmit(editTitle)}
                bg="$dark1"
                color="white"
                borderWidth={0}
              />
              <Button
                size="$2"
                circular
                icon={Check}
                bg="$green8"
                onPress={(e) => {
                  e.stopPropagation();
                  onRenameSubmit(editTitle);
                }}
              />
              <Button
                size="$2"
                circular
                icon={X}
                bg="$red8"
                onPress={(e) => {
                  e.stopPropagation();
                  onCancelEdit();
                }}
              />
            </XStack>
          ) : (
            <>
              <Text
                color="white"
                fontWeight="bold"
                fontSize="$4"
                textDecorationLine={isMuted ? "line-through" : "none"}
                numberOfLines={1}
                f={1}
                mr="$2"
              >
                {track.title}
              </Text>
              <Text color="$grayText" fontSize="$3">
                {track.duration}
              </Text>
            </>
          )}
        </XStack>

        <XStack ai="center" gap="$3" opacity={isEditing ? 0.5 : 1}>
          <Circle
            size="$3"
            bg={isPlaying ? "$accent" : "$grayText"}
            onPress={(e) => {
              e.stopPropagation();
              if (!isMuted && !isEditing) onPlay();
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
            disabled={isEditing}
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu();
            }}
          >
            <MoreVertical size={20} color="$grayText" />
          </Button>
        </XStack>
      </YStack>

      {isMuted && !isEditing && (
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
  onStartRename,
  onShare,
}: {
  track: Track;
  onClose: () => void;
  onDelete: () => void;
  onStartRename: () => void;
  onShare: () => void;
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
          icon={Pencil}
          label="Rename Track"
          onPress={() => {
            onStartRename();
          }}
        />

        <ActionButton
          icon={Share}
          label="Share Track"
          onPress={() => {
            console.log("Share");
            onShare();
          }}
        />

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
