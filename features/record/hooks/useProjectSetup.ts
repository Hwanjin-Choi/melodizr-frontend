import { useState, useCallback, useEffect, useRef } from "react";
import { Audio } from "expo-av";

const METRONOME_SOUND_URI = require("@/assets/metronome/metronome_tick.mp3");

export const useMetronome = (bpm: number) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(METRONOME_SOUND_URI, {
        shouldPlay: false,
      });
      setSound(sound);
    };
    loadSound();
    return () => {
      sound?.unloadAsync();
    };
  }, []);

  const toggleMetronome = useCallback(async () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      if (!sound) return;
      setIsPlaying(true);
      const intervalMs = (60 / bpm) * 1000;

      await sound.replayAsync();
      intervalRef.current = setInterval(async () => {
        await sound.replayAsync();
      }, intervalMs);
    }
  }, [bpm, isPlaying, sound]);

  useEffect(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const intervalMs = (60 / bpm) * 1000;
      intervalRef.current = setInterval(async () => {
        await sound?.replayAsync();
      }, intervalMs);
    }
  }, [bpm]);

  return { isMetronomePlaying: isPlaying, toggleMetronome };
};

export const calculatePresetParams = (
  originalBpm: number,
  targetBpm: number,
  targetBars: number
) => {
  const rate = targetBpm / originalBpm;

  const targetOneBarDurationSec = (60 / targetBpm) * 4;
  const totalDurationSec = targetOneBarDurationSec * targetBars;

  return {
    rate,
    totalDurationMillis: Math.round(totalDurationSec * 1000),
    displayDuration: formatDuration(Math.round(totalDurationSec * 1000)),
  };
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};
