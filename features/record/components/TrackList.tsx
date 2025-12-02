import {
  Mic,
  MoreVertical,
  Music,
  Play,
  Pause,
  Trash2,
  Share,
  VolumeX,
  X,
} from "@tamagui/lucide-icons";
import React, { useState, useMemo } from "react";
import {
  Button,
  Circle,
  ScrollView,
  Text,
  XStack,
  YStack,
  ZStack,
  Spacer,
} from "tamagui";

export interface Track {
  id: string;
  title: string;
  duration: string;
}

interface TrackListProps {
  tracks: Track[];
  onStartRecording: () => void;
}

export const TrackList = ({ tracks, onStartRecording }: TrackListProps) => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  if (tracks.length === 0) {
    return (
      <YStack
        flex={1}
        ai="center"
        jc="center"
        px="$6"
        gap="$6"
        opacity={0.8}
        mt="$10"
      >
        <Circle size={80} bg="$dark2" ai="center" jc="center">
          <Music size={40} color="$grayText" />
        </Circle>
        <YStack ai="center" gap="$2">
          <Text
            color="$textPrimary"
            fontSize="$6"
            fontWeight="bold"
            textAlign="center"
          >
            No Tracks Yet
          </Text>
          <Text color="$grayText" fontSize="$4" textAlign="center">
            Start your first project by recording your voice or instrument.
          </Text>
        </YStack>
        <Button
          size="$5"
          bg="$accent"
          color="white"
          icon={<Mic size={20} />}
          onPress={onStartRecording}
          pressStyle={{ bg: "$accentPress" }}
        >
          Start Recording
        </Button>
      </YStack>
    );
  }

  return (
    // ZStack을 써서 리스트 위에 바텀시트를 띄울 준비
    <ZStack flex={1}>
      <ScrollView flex={1} p="$4" mb={80} showsVerticalScrollIndicator={false}>
        <YStack gap="$3" pb={100}>
          <Text color="$grayText" mb="$2" ml="$2">
            Layers ({tracks.length})
          </Text>
          {tracks.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              // [핵심] 케밥 누르면 해당 트랙을 선택 상태로 만듦 -> 바텀시트 오픈
              onOpenMenu={() => setSelectedTrack(track)}
            />
          ))}
        </YStack>
      </ScrollView>

      {/* [모던 UI] 커스텀 바텀 액션 시트 */}
      {selectedTrack && (
        <CustomActionSheet
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
        />
      )}
    </ZStack>
  );
};

// --- [개별 트랙 아이템] ---
const TrackItem = ({
  track,
  onOpenMenu,
}: {
  track: Track;
  onOpenMenu: () => void;
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) setIsPlaying(false);
  };

  return (
    <ZStack
      height={90}
      borderRadius="$4"
      onPress={toggleMute}
      overflow="hidden"
    >
      <YStack
        fullscreen
        bg="$dark2"
        p="$3"
        justifyContent="space-between"
        opacity={isMuted ? 0.3 : 1}
      >
        <XStack jc="space-between" ai="center">
          <Text color="$textPrimary" fontWeight="bold" fontSize="$4">
            {track.title}
          </Text>
          <Text color="$grayText" fontSize="$2">
            {track.duration}
          </Text>
        </XStack>

        <XStack ai="center" gap="$3">
          <Circle
            size="$3"
            bg={isPlaying ? "$accent" : "$grayText"}
            onPress={(e) => {
              e.stopPropagation();
              if (!isMuted) setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? (
              <Pause size={14} color="white" fill="white" />
            ) : (
              <Play size={14} color="black" fill="black" ml={2} />
            )}
          </Circle>

          <WaveformVisualizer color={isPlaying ? "$accent" : "$grayText"} />

          {/* 케밥 메뉴 버튼 */}
          <Button
            size="$3"
            circular
            chromeless
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu(); // 부모에게 "나 열어줘!" 신호 보냄
            }}
          >
            <MoreVertical size={20} color="$grayText" />
          </Button>
        </XStack>
      </YStack>

      {/* 뮤트 오버레이 */}
      {isMuted && (
        <YStack
          fullscreen
          ai="center"
          jc="center"
          bg="rgba(0,0,0,0.3)"
          pointerEvents="none"
        >
          <XStack
            ai="center"
            gap="$2"
            bg="$dark1"
            px="$3"
            py="$2"
            borderRadius="$10"
          >
            <Text color="$textPrimary" fontWeight="bold">
              Muted
            </Text>
            <VolumeX size={16} color="white" />
          </XStack>
        </YStack>
      )}
    </ZStack>
  );
};

// --- [웨이브폼 (기존 유지)] ---
const WaveformVisualizer = ({ color }: { color: string }) => {
  const bars = useMemo(
    () =>
      Array.from({ length: 25 }).map(() => Math.floor(Math.random() * 20) + 5),
    []
  );
  return (
    <XStack flex={1} ai="center" gap={2} height={30} overflow="hidden">
      {bars.map((height, i) => (
        <YStack
          key={i}
          width={3}
          height={height}
          bg={color}
          borderRadius={2}
          opacity={0.7}
        />
      ))}
    </XStack>
  );
};
const CustomActionSheet = ({
  track,
  onClose,
}: {
  track: Track;
  onClose: () => void;
}) => {
  return (
    <ZStack fullscreen>
      {/* 1. 뒷배경 (Dimming) */}
      <YStack
        fullscreen
        bg="rgba(0,0,0,0.6)"
        onPress={onClose}
        animation="quick"
        enterStyle={{ opacity: 0 }}
      />

      {/* 2. 시트 본체 */}
      <YStack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bg="$dark2"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
        p="$4"
        gap="$2"
        // [핵심 수정] 하단 여백을 대폭 늘렸습니다 (50 -> 130)
        // 마이크 버튼이 보통 80~100 정도 공간을 차지하므로, 130 정도 주면 안전합니다.
        pb={130}
        animation="bouncy"
        enterStyle={{ y: 300, opacity: 0 }}
      >
        <XStack jc="space-between" ai="center" mb="$2">
          <YStack>
            <Text color="$textPrimary" fontSize="$5" fontWeight="bold">
              {track.title}
            </Text>
            <Text color="$grayText" fontSize="$3">
              Select an action
            </Text>
          </YStack>
          <Button size="$3" circular chromeless onPress={onClose}>
            <X size={20} color="$grayText" />
          </Button>
        </XStack>

        <ActionButton
          icon={Share}
          label="Share Track"
          onPress={() => {
            console.log("Share");
            onClose();
          }}
        />

        <Spacer size="$2" />

        <ActionButton
          icon={Trash2}
          label="Delete Track"
          isDestructive
          onPress={() => {
            console.log("Delete");
            onClose();
          }}
        />
      </YStack>
    </ZStack>
  );
};
// 액션 버튼 스타일 (iOS 스타일)
const ActionButton = ({ icon: Icon, label, isDestructive, onPress }: any) => (
  <Button
    size="$6" // 버튼 크기를 키움
    bg="$dark1"
    jc="flex-start" // 왼쪽 정렬
    borderRadius="$4"
    onPress={onPress}
    pressStyle={{ bg: "$dark3" }}
    icon={<Icon size={22} color={isDestructive ? "$red10" : "$grayText"} />}
  >
    <Text
      color={isDestructive ? "$red10" : "$textPrimary"}
      fontSize="$4"
      fontWeight="600"
    >
      {label}
    </Text>
  </Button>
);
