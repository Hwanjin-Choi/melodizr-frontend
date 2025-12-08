// features/record/components/VoiceList.tsx
import { Audio } from "expo-av";
import {
  Pause,
  Play,
  Shuffle,
  MoreVertical,
  Trash2,
  RefreshCcw,
} from "@tamagui/lucide-icons";
import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  ScrollView,
  Text,
  XStack,
  YStack,
  ZStack,
  Spacer,
  Stack,
} from "tamagui";
import { VoiceItem, VoiceLibraryService } from "@/services/VoiceLibraryService";

interface VoiceListProps {
  voices: VoiceItem[];
  onDeleteVoice: () => void;
  onConvertVoice: (v: VoiceItem) => void;
}

export const VoiceList = ({
  voices,
  onDeleteVoice,
  onConvertVoice,
}: VoiceListProps) => {
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceItem | null>(null);

  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [currentSound]);

  const handlePlay = async (voice: VoiceItem) => {
    try {
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
      }

      if (playingId === voice.id) {
        setPlayingId(null);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: voice.uri },
        { shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync();
          setCurrentSound(null);
        }
      });

      setCurrentSound(sound);
      setPlayingId(voice.id);
    } catch (error) {
      console.error("Playback failed", error);
    }
  };

  if (voices.length === 0) {
    return (
      <YStack flex={1} ai="center" jc="center" gap="$4" opacity={0.6} mt="$10">
        <Text color="$grayText" fontSize="$4">
          No recorded voices yet.
        </Text>
      </YStack>
    );
  }

  return (
    <>
      <ScrollView
        flex={1}
        p="$4"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <YStack gap="$3">
          {voices.map((voice, index) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              index={index}
              isPlaying={playingId === voice.id}
              onPlay={() => handlePlay(voice)}
              onOpenMenu={() => setSelectedVoice(voice)}
              onConvert={() => onConvertVoice(voice)}
            />
          ))}
        </YStack>
      </ScrollView>

      {/* 케밥 메뉴 액션 시트 */}
      {selectedVoice && (
        <VoiceActionSheet
          voice={selectedVoice}
          onClose={() => setSelectedVoice(null)}
          onDelete={async () => {
            if (currentSound) await currentSound.unloadAsync();
            await VoiceLibraryService.deleteVoice(selectedVoice.id);
            onDeleteVoice();
            setSelectedVoice(null);
          }}
          onConvert={() => {
            onConvertVoice(selectedVoice);
            setSelectedVoice(null);
          }}
        />
      )}
    </>
  );
};

const VoiceCard = ({
  voice,
  index,
  isPlaying,
  onPlay,
  onOpenMenu,
  onConvert,
}: {
  voice: VoiceItem;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  onOpenMenu: () => void;
  onConvert: () => void;
}) => {
  const formattedDuration = useMemo(() => {
    const seconds = Math.floor(voice.duration / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [voice.duration]);

  const typeLabel = voice.type.charAt(0).toUpperCase() + voice.type.slice(1);
  const sourceLabel = voice.sourceType === "file" ? "File" : "Recording";
  const sourceBadgeColor = voice.sourceType === "file" ? "$blue9" : "$accent";
  return (
    <YStack
      bg="$dark2"
      borderRadius="$4"
      p="$3"
      gap="$2"
      borderWidth={1}
      borderColor="$dark3"
    >
      <XStack jc="space-between" ai="center">
        <XStack ai="center" gap="$2" flex={1} mr="$2">
          {/* [추가] 배지 UI */}
          <Stack bg={sourceBadgeColor} px="$2" py="$1" borderRadius="$2">
            <Text color="white" fontSize={10} fontWeight="bold">
              {sourceLabel}
            </Text>
          </Stack>

          {/* 제목 표시 (너무 길면 잘리게 처리) */}
          <Text
            color="white"
            fontWeight="bold"
            fontSize="$4"
            numberOfLines={1}
            ellipsizeMode="tail"
            flex={1}
          >
            {voice.title}
          </Text>
        </XStack>
        <Text color="$grayText" fontSize="$3" fontFamily="$body">
          {formattedDuration}
        </Text>
        {/* <Text color="$grayText" fontSize="$3" fontFamily="$body">
          {voice.duration}
        </Text> */}
      </XStack>

      <XStack ai="center" gap="$3" height={40}>
        <Button
          size="$3"
          circular
          backgroundColor="$grayText"
          pressStyle={{ opacity: 0.8 }}
          icon={
            isPlaying ? (
              <Pause size={16} color="$dark1" fill="$dark1" />
            ) : (
              <Play size={16} color="$dark1" fill="$dark1" ml={2} />
            )
          }
          onPress={onPlay}
        />

        <VoiceWaveform isPlaying={isPlaying} />

        <Button
          size="$3"
          circular
          chromeless
          onPress={onConvert}
          icon={<Shuffle size={20} color="white" />}
        />
      </XStack>
    </YStack>
  );
};

// --- [웨이브폼 비주얼라이저] ---
const VoiceWaveform = ({ isPlaying }: { isPlaying: boolean }) => {
  // 랜덤한 높이의 바 생성 (피그마 디자인 모사)
  const bars = useMemo(
    () => Array.from({ length: 30 }).map(() => Math.random()),
    []
  );

  return (
    <XStack flex={1} ai="center" gap={2} height="100%" overflow="hidden">
      {bars.map((value, i) => (
        <Stack
          key={i}
          width={3}
          height={10 + value * 20}
          backgroundColor="$melodizrOrange"
          borderRadius={2}
          opacity={isPlaying ? 1 : 0.6}
        />
      ))}
    </XStack>
  );
};

const VoiceActionSheet = ({ voice, onClose, onDelete, onConvert }: any) => (
  <ZStack fullscreen zIndex={1000}>
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
      pb={50}
      gap="$2"
      animation="bouncy"
      enterStyle={{ y: 100, opacity: 0 }}
    >
      <Text color="$grayText" mb="$2" ml="$2" fontWeight="bold">
        Actions for {voice.title}
      </Text>

      <Button
        onPress={onConvert}
        size="$5"
        bg="$dark1"
        jc="flex-start"
        icon={RefreshCcw}
      >
        Convert to Instrument
      </Button>

      <Button
        onPress={onDelete}
        size="$5"
        bg="$dark1"
        jc="flex-start"
        icon={Trash2}
        color="$red10"
        pressStyle={{ bg: "$red10", opacity: 0.2 }}
      >
        Delete Voice
      </Button>
    </YStack>
  </ZStack>
);
