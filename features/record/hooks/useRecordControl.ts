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
  { label: "Instrument", value: "instrument" },
  { label: "Auto Tune", value: "tune" },
];

export const TUNE_PRESET_OPTIONS = [
  { label: "Natural (Default)", value: "natural" },
  { label: "Subtle", value: "subtle" },
  { label: "Hard", value: "hard" },
  { label: "Choir", value: "choir" },
];

export const KEY_SCALE_OPTIONS = [
  { label: "Auto Detection", value: "auto" },
  { label: "C Major", value: "C Major" },
  { label: "A Minor", value: "A Minor" },
  { label: "G Major", value: "G Major" },
  { label: "E Minor", value: "E Minor" },
  { label: "D Major", value: "D Major" },
  { label: "B Minor", value: "B Minor" },
  { label: "F Major", value: "F Major" },
  { label: "D Minor", value: "D Minor" },
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

export const INSTRUMENT_OPTIONS = [
  { label: "Acoustic Guitar", value: "acoustic_guitar" },
  { label: "Dry Piano", value: "dry_piano" },
];

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

  // --- States ---
  const [mode, setMode] = useState<string>(MODE_OPTIONS[0].value);
  const [textPrompt, setTextPrompt] = useState<string>("");

  // Instrument Mode Options
  const [targetInstrument, setTargetInstrument] = useState<string>(
    INSTRUMENT_OPTIONS[0].value
  );

  // Tune Mode Options (Shared or Specific)
  const [tunePreset, setTunePreset] = useState<string>(
    TUNE_PRESET_OPTIONS[0].value
  );
  const [keyHint, setKeyHint] = useState<string>(KEY_SCALE_OPTIONS[0].value); // [신규] Key Hint State

  const [isPlaying, setIsPlaying] = useState(false);
  const metronomeSoundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const snapPoints = useMemo(() => ["85%"], []);

  const maxDuration = useMemo(() => {
    return (60 / bpm) * 4 * bars * 1000;
  }, [bpm, bars]);

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(METRONOME_SOUND);
        await sound.setVolumeAsync(1.0);
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ... (Recoding logic omitted for brevity - same as before) ...
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
      const START_COUNT = 8;
      setCountdownValue(START_COUNT);
      setSourceType("recording");
      setOriginalFileName("");

      if (timerRef.current) clearTimeout(timerRef.current);

      const beatDuration = (60 / bpm) * 1000;
      let currentCount = START_COUNT;

      try {
        await metronomeSoundRef.current?.replayAsync();
      } catch {}

      let expected = Date.now() + beatDuration;

      const tick = () => {
        const now = Date.now();
        const drift = now - expected;

        currentCount--;
        setCountdownValue(currentCount);

        if (currentCount > 0) {
          try {
            metronomeSoundRef.current?.replayAsync();
          } catch {}

          expected += beatDuration;
          timerRef.current = setTimeout(
            tick,
            Math.max(0, beatDuration - drift)
          );
        } else {
          _startRecordingActual();
        }
      };

      timerRef.current = setTimeout(tick, beatDuration);
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
    if (timerRef.current) clearTimeout(timerRef.current);

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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
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

  // --- Updated onConvert Logic ---
  const onConvert = useCallback(async () => {
    if (!tempUri) {
      Alert.alert("알림", "No File.");
      return;
    }

    // Console Log Process
    console.log("---------- CONVERSION REQUEST ----------");
    console.log("Mode:", mode);
    console.log("URI:", tempUri);
    console.log("BPM:", bpm);

    if (mode === "instrument") {
      console.log("Target Instrument:", targetInstrument);
      console.log("Text Prompt:", textPrompt);
    } else {
      console.log("Auto Tune Active");
      console.log("Tune Preset:", tunePreset);
      console.log("Key Hint:", keyHint);
    }
    console.log("----------------------------------------");

    try {
      setStep("converting");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const convertedUri = tempUri;

      const savedVoice = await VoiceLibraryService.saveVoice(
        tempUri,
        tempDuration,
        "humming",
        sourceType,
        sourceType === "file" ? originalFileName : undefined
      );

      const modeLabel =
        MODE_OPTIONS.find((m) => m.value === mode)?.label || mode;

      // Title logic
      let titleSuffix = "";
      if (mode === "instrument") {
        const instLabel = INSTRUMENT_OPTIONS.find(
          (i) => i.value === targetInstrument
        )?.label;
        titleSuffix = `(${instLabel})`;
      } else {
        const keyLabel = KEY_SCALE_OPTIONS.find(
          (k) => k.value === keyHint
        )?.label;
        titleSuffix = `(${keyLabel === "Auto Detection" ? "Auto" : keyLabel})`;
      }

      const newTrack = {
        id: Date.now().toString(),
        title: `${modeLabel} ${titleSuffix}`,
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
    targetInstrument,
    tunePreset,
    keyHint,
  ]);

  const onCloseSheet = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (e) {
        console.error("Failed to cleanup recording on close", e);
      }
      setRecording(null);
    }

    setStep("idle");
    setIsPlaying(false);
    setDurationMillis(0);
    setTempUri(null);
    setTempDuration(0);
    setTextPrompt("");
    setTargetInstrument(INSTRUMENT_OPTIONS[0].value);
    setKeyHint(KEY_SCALE_OPTIONS[0].value);
    setTunePreset(TUNE_PRESET_OPTIONS[0].value);
    ref.current?.close();
  }, [ref, recording]);

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
    targetInstrument,
    setTargetInstrument,
    tunePreset,
    setTunePreset,
    keyHint,
    setKeyHint,
    isPlaying,
    snapPoints,
    durationMillis,
    tempDuration,
    tempUri,
    countdownValue,
    maxDuration,
    bpm,
    bars,
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
