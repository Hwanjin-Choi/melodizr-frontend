import React, { useEffect, useState, useRef, useMemo } from "react";
import { Audio } from "expo-av";
import {
  View,
  Text,
  YStack,
  XStack,
  Button,
  Slider,
  Circle,
  Input,
} from "tamagui";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Check,
  X,
  Pencil,
} from "@tamagui/lucide-icons";
import { parseDurationToMillis, formatMillisToTime } from "@/utils/formatUtils";
import { type Track } from "@/features/record/components/TrackList";
import { getSmartUri } from "@/utils/pathUtils";

/* interface Track {
  id: string;
  uri: string;
  duration: string;
  title: string;
} */

interface ProjectPlayerProps {
  layers: Track[];
  title: string;
  onTitleChange: (newTitle: string) => void;
}

export const ProjectPlayer = ({
  layers,
  title,
  onTitleChange,
}: ProjectPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const soundsRef = useRef<Audio.Sound[]>([]);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (layers.length === 0) return;
    const max = Math.max(
      ...layers.map((l) => parseDurationToMillis(l.duration))
    );
    setMaxDuration(max);
  }, [layers]);

  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  useEffect(() => {
    const loadSounds = async () => {
      await unloadAllSounds();

      if (layers.length === 0) return;

      try {
        const loadedSounds: Audio.Sound[] = [];

        await Promise.all(
          layers.map(async (layer) => {
            const playableUri = getSmartUri(layer.uri);
            if (!playableUri) return;

            const { sound } = await Audio.Sound.createAsync(
              { uri: playableUri },
              { shouldPlay: false, positionMillis: 0 }
            );
            loadedSounds.push(sound);
          })
        );

        soundsRef.current = loadedSounds;
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load project sounds", error);
      }
    };

    loadSounds();

    return () => {
      unloadAllSounds();
    };
  }, [layers]);

  const unloadAllSounds = async () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    const promises = soundsRef.current.map((sound) => sound.unloadAsync());
    await Promise.all(promises);
    soundsRef.current = [];
    setIsPlaying(false);
    setPosition(0);
  };

  const handleStop = async () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    setIsPlaying(false);
    setPosition(0);

    try {
      await Promise.all(
        soundsRef.current.map(async (s) => {
          await s.stopAsync();
        })
      );
    } catch (e) {
      console.error("Stop error", e);
    }
  };

  const togglePlay = async () => {
    if (!isLoaded || soundsRef.current.length === 0) return;

    if (isPlaying) {
      // [일시정지 로직]
      if (progressInterval.current) clearInterval(progressInterval.current);
      setIsPlaying(false);
      await Promise.all(soundsRef.current.map((s) => s.pauseAsync()));
    } else {
      // [재생 시작 로직]

      if (position >= maxDuration) {
        setPosition(0);
        await Promise.all(soundsRef.current.map((s) => s.setPositionAsync(0)));
      }

      await Promise.all(soundsRef.current.map((s) => s.playAsync()));
      setIsPlaying(true);

      progressInterval.current = setInterval(() => {
        setPosition((prev) => {
          const next = prev + 100;

          if (next >= maxDuration) {
            if (progressInterval.current)
              clearInterval(progressInterval.current);

            setTimeout(() => handleStop(), 0);

            return maxDuration;
          }
          return next;
        });
      }, 100);
    }
  };

  const seekTo = async (value: number) => {
    setPosition(value);
    await Promise.all(soundsRef.current.map((s) => s.setPositionAsync(value)));
  };

  const saveTitle = () => {
    if (editTitle.trim()) {
      onTitleChange(editTitle);
    } else {
      setEditTitle(title);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  return (
    <YStack
      bg="$dark2"
      borderRadius="$4"
      p="$4"
      gap="$4"
      borderWidth={1}
      borderColor="$dark3"
      mt="$4"
    >
      <XStack jc="space-between" ai="center">
        {isEditing ? (
          <XStack f={1} ai="center" gap="$2">
            <Input
              value={editTitle}
              onChangeText={setEditTitle}
              f={1}
              size="$3"
              bg="$dark1"
              color="white"
              autoFocus
            />
            <Button
              size="$2"
              circular
              icon={Check}
              onPress={saveTitle}
              bg="$green8"
            />
            <Button
              size="$2"
              circular
              icon={X}
              onPress={cancelEdit}
              bg="$red8"
            />
          </XStack>
        ) : (
          <XStack ai="center" gap="$2" onPress={() => setIsEditing(true)}>
            <Text
              color="white"
              fontWeight="bold"
              fontSize="$5"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Pencil size={14} color="$grayText" />
          </XStack>
        )}

        {!isEditing && (
          <Text color="$grayText" fontSize="$3">
            {layers.length} Tracks
          </Text>
        )}
      </XStack>

      <XStack jc="space-between">
        <Text color="$accent" fontWeight="bold">
          {formatMillisToTime(position)}
        </Text>
        <Text color="$grayText">{formatMillisToTime(maxDuration)}</Text>
      </XStack>

      <Slider
        size="$4"
        width="100%"
        defaultValue={[0]}
        value={[position]}
        min={0}
        max={maxDuration}
        step={100}
        onValueChange={(val: number[]) => {
          setPosition(val[0]);
        }}
        onSlideEnd={(_event, value) => {
          seekTo(value);
        }}
      >
        <Slider.Track bg="$dark3" height={4}>
          <Slider.TrackActive bg="$accent" />
        </Slider.Track>
        <Slider.Thumb size="$2" index={0} circular bg="white" elevation="$2" />
      </Slider>

      <XStack jc="center" ai="center" gap="$6" mt="$2">
        <Button
          circular
          size="$4"
          chromeless
          icon={<SkipBack size={24} color="white" />}
          onPress={() => seekTo(0)}
        />

        <Circle
          size={70}
          bg="$accent"
          pressStyle={{ opacity: 0.8, scale: 0.95 }}
          onPress={togglePlay}
          elevation="$4"
        >
          {isPlaying ? (
            <Pause size={32} color="white" fill="white" />
          ) : (
            <Play size={32} color="white" fill="white" ml={4} />
          )}
        </Circle>

        <Button
          circular
          size="$4"
          chromeless
          icon={<SkipForward size={24} color="white" />}
          onPress={() => seekTo(maxDuration)}
        />
      </XStack>
    </YStack>
  );
};
