import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useState } from "react";

// --- [Type Definitions] ---
export type RecordStep = "idle" | "recording" | "review" | "converting";
export type VoiceType = "humming" | "beatbox";
export type InstrumentType = "drum" | "piano" | "bass" | "guitar";

// --- [Constant Data] ---
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

export const useRecordControl = (ref: React.RefObject<BottomSheet>) => {
  const [step, setStep] = useState<RecordStep>("idle");
  const [voiceType, setVoiceType] = useState<VoiceType>("humming");
  const [instrument, setInstrument] = useState<InstrumentType>("piano");
  const [isPlaying, setIsPlaying] = useState(false);

  // Snap points are used as is (modified in RecordBottomSheet.tsx)
  const snapPoints = useMemo(() => ["60%"], []);

  const onStartRecording = useCallback(() => setStep("recording"), []);

  const onStopRecording = useCallback(() => {
    // After beatbox recording, automatically set the instrument to drum kit
    if (voiceType === "beatbox") {
      setInstrument("drum");
    }
    setStep("review");
  }, [voiceType]);

  const onConvert = useCallback(() => {
    setStep("converting");
    // TODO: Actual conversion API call and time measurement logic (e.g., complete after 3 seconds)
    setTimeout(() => {
      // After conversion is complete, close the sheet or move to another step if necessary
      console.log("Conversion complete.");
      // ref.current?.dismiss();
      setStep("idle"); // Example: Return to idle state after conversion
    }, 3000);
  }, []);

  const onVoiceTypeChange = useCallback((type: VoiceType) => {
    setVoiceType(type);
    const firstOption = INSTRUMENT_OPTIONS[type][0].value;
    setInstrument(firstOption);
  }, []);

  const onCloseSheet = useCallback(() => {
    setStep("idle");
    setIsPlaying(false);
  }, []);

  return {
    // State
    step,
    voiceType,
    instrument,
    isPlaying,
    snapPoints,

    // State change functions
    setStep,
    setInstrument,
    setIsPlaying,
    onStartRecording,
    onStopRecording,
    onConvert,
    onVoiceTypeChange,
    onCloseSheet,
  };
};

export type RecordControl = ReturnType<typeof useRecordControl>;
