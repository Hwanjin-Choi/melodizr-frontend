import BottomSheet from "@gorhom/bottom-sheet";
import { Audio } from "expo-av";
import { useCallback, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import { MelodizrApiService } from "@/services/MelodizrApiService";
import { VoiceLibraryService, VoiceItem } from "@/services/VoiceLibraryService";
import { TrackLibraryService } from "@/services/TrackLibraryService";

interface UseRecordControlProps {
  onConversionComplete?: (originalVoice: any, newTrack: any) => void;
}

export type RecordStep = "idle" | "recording" | "review" | "converting";
export type VoiceType = "humming" | "beatbox";
export type InstrumentType = string;

/* export const VOICE_OPTIONS: { label: string; value: VoiceType }[] = [
  { label: "Humming Voice", value: "humming" },
  { label: "Beatbox", value: "beatbox" },
]; */

export const INSTRUMENT_OPTIONS = [
  { label: "Acoustic Guitar", value: "acoustic_guitar" },
  { label: "Electric Bass", value: "electric_bass" },
  { label: "Electric Piano", value: "electric_piano" },
  { label: "Dry Piano", value: "dry_piano" },
  { label: "Organ", value: "organ" },
  { label: "String", value: "string" },
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
  { onConversionComplete }: UseRecordControlProps = {}
) => {
  const [step, setStep] = useState<RecordStep>("idle");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const [tempUri, setTempUri] = useState<string | null>(null);
  const [tempDuration, setTempDuration] = useState<number>(0);

  const [durationMillis, setDurationMillis] = useState(0);

  const [sourceType, setSourceType] = useState<"recording" | "file">(
    "recording"
  );
  const [originalFileName, setOriginalFileName] = useState<string>("");

  /* const [voiceType, setVoiceType] = useState<VoiceType>("humming"); */
  const [instrument, setInstrument] = useState<InstrumentType>("dry_piano");
  const [textPrompt, setTextPrompt] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);

  const snapPoints = useMemo(() => ["60%"], []);

  const onStartRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        RECORDING_OPTIONS_WAV
      );

      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setDurationMillis(status.durationMillis);
        }
      });

      setRecording(newRecording);
      setSourceType("recording");
      setOriginalFileName("");
      setStep("recording");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }, []);

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
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: asset.uri },
        { shouldPlay: false }
      );
      const status = await sound.getStatusAsync();
      const duration = status.isLoaded ? status.durationMillis : 0;
      await sound.unloadAsync();

      setTempUri(asset.uri);
      setTempDuration(duration ?? 0);
      setSourceType("file");
      setOriginalFileName(asset.name);
      await prepareForPlayback();
      setStep("review");
    } catch (err) {
      console.error("Failed to upload file", err);
    }
  }, []);

  const onConvert = useCallback(async () => {
    if (!tempUri) {
      Alert.alert("알림", "No File.");
      return;
    }

    try {
      setStep("converting");

      const convertedUri = await MelodizrApiService.convertAudio(
        tempUri,
        instrument,
        "off",
        "None",
        textPrompt || "None" // Pass user prompt or "None"
      );

      const savedVoice = await VoiceLibraryService.saveVoice(
        tempUri,
        tempDuration,
        "humming",
        sourceType,
        sourceType === "file" ? originalFileName : undefined
      );

      const selectedInstLabel =
        INSTRUMENT_OPTIONS.find((i) => i.value === instrument)?.label ||
        instrument;

      const newTrack = {
        id: Date.now().toString(),
        title: `${selectedInstLabel} (Converted)`,
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
      Alert.alert("변환 실패", "network error");
      setStep("review");
    }
  }, [
    tempUri,
    tempDuration,
    instrument,
    sourceType,
    originalFileName,
    onConversionComplete,
    textPrompt, // Depend on textPrompt
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
    instrument,
    textPrompt,
    setTextPrompt,
    isPlaying,
    snapPoints,
    durationMillis,
    tempDuration,
    tempUri,
    setStep,
    setInstrument,
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
