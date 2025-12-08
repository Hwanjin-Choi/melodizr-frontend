import BottomSheet from "@gorhom/bottom-sheet";
import { Audio } from "expo-av";
import { useCallback, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import { MelodizrApiService } from "@/services/MelodizrApiService";
import { VoiceLibraryService } from "@/services/VoiceLibraryService";
import { TrackLibraryService } from "@/services/TrackLibraryService";

interface UseRecordControlProps {
  onConversionComplete?: (originalVoice: any, newTrack: any) => void;
}

export type RecordStep = "idle" | "recording" | "review" | "converting";
export type VoiceType = "humming" | "beatbox";
export type InstrumentType = "drum" | "piano" | "bass" | "guitar";

export const VOICE_OPTIONS: { label: string; value: VoiceType }[] = [
  { label: "Humming Voice", value: "humming" },
  { label: "Beatbox", value: "beatbox" },
];

export const INSTRUMENT_OPTIONS: Record<
  VoiceType,
  { label: string; value: InstrumentType }[]
> = {
  humming: [
    { label: "Piano", value: "piano" },
    { label: "Bass", value: "bass" },
    { label: "Guitar", value: "guitar" },
  ],
  beatbox: [{ label: "Drum Kit", value: "drum" }],
};

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

  const [voiceType, setVoiceType] = useState<VoiceType>("humming");
  const [instrument, setInstrument] = useState<InstrumentType>("piano");
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

  const onStopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      recording.setOnRecordingStatusUpdate(null);
      const status = await recording.getStatusAsync();
      const finalDuration =
        status.isLoaded && status.durationMillis > 0
          ? status.durationMillis
          : durationMillis;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);
      setDurationMillis(0);

      if (uri) {
        setTempUri(uri);
        setTempDuration(finalDuration);
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

      const { sound } = await Audio.Sound.createAsync(
        { uri: asset.uri },
        { shouldPlay: false }
      );
      const status = await sound.getStatusAsync();
      const duration = status.isLoaded ? status.durationMillis : 0;
      await sound.unloadAsync();

      setTempUri(asset.uri);
      setTempDuration(duration);
      setSourceType("file");
      setOriginalFileName(asset.name);
      setStep("review");
    } catch (err) {
      console.error("Failed to upload file", err);
    }
  }, []);

  /* const onConvert = useCallback(async () => {
    if (!tempUri) return;

    try {
      setStep("converting");
      const convertedUri = await MelodizrApiService.convertAudio(
        tempUri,
        instrument
      );

      const savedVoice = await VoiceLibraryService.saveVoice(
        tempUri,
        tempDuration,
        voiceType
      );

      const newTrack = {
        id: Date.now().toString(),
        title: `${
          instrument.charAt(0).toUpperCase() + instrument.slice(1)
        } Track`,
        duration: formatDuration(tempDuration),
        uri: convertedUri,
        originalVoiceId: savedVoice.id,
      };

      if (onConversionComplete) {
        onConversionComplete(savedVoice, newTrack);
      }
      onCloseSheet();
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("변환에 실패했습니다. 다시 시도해주세요.");
      setStep("review");
    }
  }, [tempUri, tempDuration, voiceType, instrument, onConversionComplete]); */

  const onConvert = useCallback(async () => {
    if (!tempUri) {
      Alert.alert("알림");
      return;
    }

    try {
      setStep("converting"); // 로딩 상태
      console.log("check");
      const convertedUri = await MelodizrApiService.convertAudio(
        tempUri,
        instrument, // 선택한 악기 (piano, guitar 등)
        "off", // keyMode
        "None", // keyHint (성공 사례에 맞춰 대소문자 유지)
        "concert" // textPrompt
      );

      console.log(convertedUri, "check");

      // 1. 원본 보이스 저장
      const savedVoice = await VoiceLibraryService.saveVoice(
        tempUri,
        tempDuration,
        voiceType,
        sourceType, // "recording" | "file"
        sourceType === "file" ? originalFileName : undefined
      );

      // 2. 변환된 트랙 데이터 생성
      const newTrack = {
        id: Date.now().toString(),
        title: `${
          instrument.charAt(0).toUpperCase() + instrument.slice(1)
        } (Converted)`,
        duration: formatDuration(tempDuration),
        uri: convertedUri,
        originalVoiceId: savedVoice.id,
        createdAt: Date.now(),
      };

      // 3. 완료 처리

      await TrackLibraryService.saveTrack(newTrack);

      if (onConversionComplete) {
        onConversionComplete(savedVoice, newTrack);
      }

      onCloseSheet();
    } catch (error) {
      console.error("Conversion failed:", error);
      Alert.alert("변환 실패");
      setStep("review");
    }
  }, [tempUri, tempDuration, voiceType, instrument, onConversionComplete]);

  const onCloseSheet = useCallback(() => {
    setStep("idle");
    setIsPlaying(false);
    setDurationMillis(0);
    setTempUri(null);
    setTempDuration(0);
    ref.current?.close();
  }, [ref]);

  return {
    step,
    voiceType,
    instrument,
    isPlaying,
    snapPoints,
    durationMillis,
    tempDuration,
    setStep,
    setInstrument,
    setIsPlaying,
    onStartRecording,
    onStopRecording,
    onUploadFile,
    onConvert,
    onVoiceTypeChange: setVoiceType,
    onCloseSheet,
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
