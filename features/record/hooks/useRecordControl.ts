import BottomSheet from "@gorhom/bottom-sheet";
import { Audio } from "expo-av";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import { MelodizrApiService } from "@/services/MelodizrApiService";
import { VoiceLibraryService, VoiceItem } from "@/services/VoiceLibraryService";
import { TrackLibraryService } from "@/services/TrackLibraryService";

const METRONOME_SOUND = require("@/assets/metronome/metronome_tick.mp3");

interface UseRecordControlProps {
  onConversionComplete?: (originalVoice: any, newTrack: any) => void;
  bpm?: number;
  bars?: number;
}

export type RecordStep =
  | "idle"
  | "counting"
  | "recording"
  | "review"
  | "converting";

export const MODE_OPTIONS = [
  { label: "Hum To Instrument", value: "instrument" },
  { label: "Auto Tune", value: "tune" },
];

const RECORDING_OPTIONS_WAV: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: ".wav",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: ".wav",
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.MAX,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/wav",
    bitsPerSecond: 128000,
  },
};

export const useRecordControl = (
  ref: React.RefObject<BottomSheet>,
  { onConversionComplete, bpm = 120, bars = 4 }: UseRecordControlProps = {}
) => {
  const [step, setStep] = useState<RecordStep>("idle");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const [tempUri, setTempUri] = useState<string | null>(null);
  const [tempDuration, setTempDuration] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [countdownValue, setCountdownValue] = useState(0);

  const [sourceType, setSourceType] = useState<"recording" | "file">(
    "recording"
  );
  const [originalFileName, setOriginalFileName] = useState<string>("");

  // [변경] Instrument 대신 Mode 사용
  const [mode, setMode] = useState<string>(MODE_OPTIONS[0].value);
  const [textPrompt, setTextPrompt] = useState<string>("");

  const [isPlaying, setIsPlaying] = useState(false);
  const metronomeSoundRef = useRef<Audio.Sound | null>(null);

  const snapPoints = useMemo(() => ["60%"], []);

  const maxDuration = useMemo(() => {
    return (60 / bpm) * 4 * bars * 1000;
  }, [bpm, bars]);

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(METRONOME_SOUND);
        metronomeSoundRef.current = sound;
      } catch (e) {
        console.error("Failed to load metronome sound", e);
      }
    };
    loadSound();
    return () => {
      metronomeSoundRef.current?.unloadAsync();
    };
  }, []);

  const _startRecordingActual = useCallback(async () => {
    try {
      const { recording: newRecording } = await Audio.Recording.createAsync(
        RECORDING_OPTIONS_WAV
      );

      newRecording.setOnRecordingStatusUpdate(async (status) => {
        if (status.isRecording) {
          setDurationMillis(status.durationMillis);

          if (status.durationMillis >= maxDuration) {
            await newRecording.stopAndUnloadAsync();
            const uri = newRecording.getURI();

            setRecording(null);
            setDurationMillis(maxDuration);

            if (uri) {
              setTempUri(uri);
              setTempDuration(maxDuration);
              await prepareForPlayback();
              setStep("review");
            } else {
              setStep("idle");
            }
          }
        }
      });

      setRecording(newRecording);
      setStep("recording");
    } catch (err) {
      console.error("Failed to start actual recording", err);
      setStep("idle");
    }
  }, [maxDuration]);

  const onStartRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      setStep("counting");
      setCountdownValue(4);
      setSourceType("recording");
      setOriginalFileName("");

      let count = 4;
      const beatDuration = (60 / bpm) * 1000;

      try {
        await metronomeSoundRef.current?.replayAsync();
      } catch {}

      const interval = setInterval(async () => {
        count--;
        setCountdownValue(count);

        if (count > 0) {
          try {
            await metronomeSoundRef.current?.replayAsync();
          } catch {}
        }

        if (count === 0) {
          clearInterval(interval);
          _startRecordingActual();
        }
      }, beatDuration);
    } catch (err) {
      console.error("Failed to init recording sequence", err);
      setStep("idle");
    }
  }, [bpm, _startRecordingActual]);

  const prepareForPlayback = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (e) {
      console.error("Audio mode setup failed", e);
    }
  };

  const onStopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      recording.setOnRecordingStatusUpdate(null);
      const status = await recording.getStatusAsync();
      const finalDuration =
        status.durationMillis > 0 ? status.durationMillis : durationMillis;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);
      setDurationMillis(0);

      if (uri) {
        setTempUri(uri);
        setTempDuration(finalDuration);

        await prepareForPlayback();
        setStep("review");
      } else {
        setStep("idle");
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
      setStep("idle");
    }
  }, [recording, durationMillis]);

  const onUploadFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const asset = result.assets[0];

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: asset.uri },
        { shouldPlay: false }
      );
      const status = await sound.getStatusAsync();
      const duration = status.isLoaded ? status.durationMillis : 0;
      await sound.unloadAsync();

      if (duration > maxDuration + 500) {
        Alert.alert(
          "File too long",
          `Please upload audio shorter than ${Math.ceil(
            maxDuration / 1000
          )} seconds.`
        );
        return;
      }

      setTempUri(asset.uri);
      setTempDuration(duration ?? 0);
      setSourceType("file");
      setOriginalFileName(asset.name);
      await prepareForPlayback();
      setStep("review");
    } catch (err) {
      console.error("Failed to upload file", err);
    }
  }, [maxDuration]);

  const onConvert = useCallback(async () => {
    if (!tempUri) {
      Alert.alert("알림", "No File.");
      return;
    }

    try {
      setStep("converting");

      const convertedUri = await MelodizrApiService.convertAudio(
        tempUri,
        mode,
        bpm,
        textPrompt
      );

      const savedVoice = await VoiceLibraryService.saveVoice(
        tempUri,
        tempDuration,
        "humming",
        sourceType,
        sourceType === "file" ? originalFileName : undefined
      );

      const modeLabel =
        MODE_OPTIONS.find((m) => m.value === mode)?.label || mode;

      const newTrack = {
        id: Date.now().toString(),
        title: `${modeLabel} (Converted)`,
        duration: formatDuration(tempDuration),
        uri: convertedUri,
        originalVoiceId: savedVoice.id,
        createdAt: Date.now(),
      };

      await TrackLibraryService.saveTrack(newTrack);

      if (onConversionComplete) {
        onConversionComplete(savedVoice, newTrack);
      }

      onCloseSheet();
    } catch (error) {
      console.error("Conversion failed:", error);
      Alert.alert("변환 실패", "Failed to process audio.");
      setStep("review");
    }
  }, [
    tempUri,
    tempDuration,
    mode,
    bpm,
    sourceType,
    originalFileName,
    onConversionComplete,
    textPrompt,
  ]);

  const onCloseSheet = useCallback(() => {
    setStep("idle");
    setIsPlaying(false);
    setDurationMillis(0);
    setTempUri(null);
    setTempDuration(0);
    setTextPrompt("");
    ref.current?.close();
  }, [ref]);

  const startFromExistingVoice = useCallback(
    (voice: VoiceItem) => {
      setTempUri(voice.uri);
      setTempDuration(voice.duration);
      setSourceType(voice.sourceType);

      if (voice.sourceType === "file") {
        setOriginalFileName(voice.title);
      }

      setStep("review");
      ref.current?.expand();
    },
    [ref]
  );

  const onRetake = useCallback(() => {
    setTempUri(null);
    setTempDuration(0);
    setSourceType("recording");
    setOriginalFileName("");
    setTextPrompt("");
    setStep("idle");
  }, []);

  return {
    step,
    mode,
    setMode,
    textPrompt,
    setTextPrompt,
    isPlaying,
    snapPoints,
    durationMillis,
    tempDuration,
    tempUri,
    countdownValue,
    maxDuration,
    setStep,
    setIsPlaying,
    onStartRecording,
    onStopRecording,
    onUploadFile,
    onConvert,
    onCloseSheet,
    startFromExistingVoice,
    onRetake,
  };
};

const formatDuration = (millis: number) => {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

export type RecordControl = ReturnType<typeof useRecordControl>;
