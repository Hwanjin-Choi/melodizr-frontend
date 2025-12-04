import BottomSheet from "@gorhom/bottom-sheet";
import { Audio } from "expo-av";
import { useCallback, useMemo, useState } from "react";

interface UseRecordControlProps {
  onRecordingComplete?: (uri: string, duration: number) => void;
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

export const useRecordControl = (
  ref: React.RefObject<BottomSheet>,
  { onRecordingComplete }: UseRecordControlProps = {}
) => {
  const [step, setStep] = useState<RecordStep>("idle");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const [durationMillis, setDurationMillis] = useState(0);

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
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setDurationMillis(status.durationMillis);
        }
      });

      setRecording(newRecording);
      setStep("recording");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }, []);

  // --- [녹음 종료] ---
  /*   const onStopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      recording.setOnRecordingStatusUpdate(null);

      const status = await recording.getStatusAsync();
      const finalDuration = status.isLoaded ? status.durationMillis : 0;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);
      setDurationMillis(0);

      if (uri && onRecordingComplete) {
        onRecordingComplete(uri, finalDuration || 0);
      }

      setStep("idle");
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  }, [recording, onRecordingComplete]); */

  const onStopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      // 1. 상태 업데이트 중지
      recording.setOnRecordingStatusUpdate(null);

      // 2. 현재 상태 가져오기
      const status = await recording.getStatusAsync();
      console.log(status);

      const finalDuration =
        status.isLoaded && status.durationMillis > 0
          ? status.durationMillis
          : durationMillis;

      // 3. 녹음 종료 및 언로드
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);
      setDurationMillis(0);

      // 4. 저장 로직 실행 (0이 아닌 올바른 시간이 넘어갑니다)
      if (uri && onRecordingComplete) {
        onRecordingComplete(uri, finalDuration);
      }

      setStep("idle");
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
    // [중요] 배열 끝에 durationMillis를 반드시 추가해야 최신 시간을 가져올 수 있사옵니다.
  }, [recording, onRecordingComplete, durationMillis]);

  const onCloseSheet = useCallback(() => {
    setStep("idle");
    setIsPlaying(false);
    setDurationMillis(0);
  }, []);

  return {
    step,
    voiceType,
    instrument,
    isPlaying,
    snapPoints,
    durationMillis,
    setStep,
    setInstrument,
    setIsPlaying,
    onStartRecording,
    onStopRecording,
    onConvert: () => {},
    onVoiceTypeChange: () => {},
    onCloseSheet,
  };
};

export type RecordControl = ReturnType<typeof useRecordControl>;
