import { useState, useCallback, useEffect, useRef } from "react";
import { Audio } from "expo-av";

const METRONOME_SOUND_URI = require("@/assets/metronome/metronome_tick.mp3");

export const useMetronome = (bpm: number) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTicking, setIsTicking] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const visualTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(METRONOME_SOUND_URI, {
          shouldPlay: false,
        });
        setSound(sound);
      } catch (e) {
        console.error("Metronome load failed", e);
      }
    };
    loadSound();
    return () => {
      sound?.unloadAsync();
    };
  }, []);

  const playTick = useCallback(async () => {
    try {
      await sound?.replayAsync();
    } catch (e) {}

    setIsTicking(true);
    if (visualTimeoutRef.current) clearTimeout(visualTimeoutRef.current);
    visualTimeoutRef.current = setTimeout(() => {
      setIsTicking(false);
    }, 150);
  }, [sound]);

  const toggleMetronome = useCallback(async () => {
    if (isPlaying) {
      // [STOP]
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
      setIsTicking(false);
    } else {
      // [START]
      if (!sound) return;

      setIsPlaying(true);
      const intervalMs = (60 / bpm) * 1000;

      playTick();

      intervalRef.current = setInterval(() => {
        playTick();
      }, intervalMs);
    }
  }, [bpm, isPlaying, sound, playTick]);

  useEffect(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const intervalMs = (60 / bpm) * 1000;
      intervalRef.current = setInterval(() => {
        playTick();
      }, intervalMs);
    }
  }, [bpm]);

  return { isMetronomePlaying: isPlaying, toggleMetronome, isTicking };
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
