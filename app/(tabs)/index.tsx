import {
  Mic,
  Music,
  Plus,
  MoreHorizontal,
  Play,
  Disc,
  Clock,
  ChevronRight,
  Circle,
  Sparkles,
} from "@tamagui/lucide-icons";
import React from "react";
import {
  Button,
  Card,
  H2,
  H4,
  Paragraph,
  ScrollView,
  XStack,
  YStack,
  Image,
  Spacer,
  Text,
  Avatar,
  Theme,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Logo from "@/assets/Logo.png";

export default function HomePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <Theme name="dark">
      <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$5" paddingBottom="$8">
            {/* 1. Header Section */}
            <YStack paddingHorizontal="$4" marginTop="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                  <Paragraph color="$grayText" fontSize="$3" fontWeight="600">
                    Good Evening,
                  </Paragraph>
                  <H2 color="$color" fontWeight="bold">
                    Melodizr
                  </H2>
                </YStack>
                <Avatar circular size="$4" padding="$2">
                  <Avatar.Image src={Logo} objectFit="contain" />
                  <Avatar.Fallback />
                </Avatar>
              </XStack>
            </YStack>

            {/* 2. Hero CTA (Start Recording) */}
            <YStack paddingHorizontal="$4">
              <Card
                bordered
                animation="bouncy"
                scale={0.97}
                hoverStyle={{ scale: 1 }}
                pressStyle={{ scale: 0.95 }}
                backgroundColor="$dark2"
                borderColor="$dark3"
                height={180}
                overflow="hidden"
                onPress={() => router.push("/record")}
              >
                <Card.Header padded zIndex={2}>
                  <H4 color="white">Start New Project</H4>
                  <Paragraph theme="alt2" numberOfLines={2}>
                    Record your voice and convert it into instruments instantly.
                  </Paragraph>
                </Card.Header>
                <Card.Background>
                  {/* Decorative Background Elements */}
                  <YStack fullscreen backgroundColor="$accent" opacity={0.1} />
                  <Mic
                    size={120}
                    color="$accent"
                    opacity={0.2}
                    position="absolute"
                    bottom={-20}
                    right={-20}
                    transform={[{ rotate: "-15deg" }]}
                  />
                </Card.Background>
                <Card.Footer padded>
                  <XStack justifyContent="flex-end" width="100%">
                    <Button
                      size="$3"
                      backgroundColor="$accent"
                      color="white"
                      icon={<Plus size={18} />}
                      circular
                    />
                  </XStack>
                </Card.Footer>
              </Card>
            </YStack>

            {/* 3. Recent Projects (Horizontal Scroll) */}
            <YStack gap="$3">
              <XStack
                paddingHorizontal="$4"
                justifyContent="space-between"
                alignItems="center"
              >
                <H4 fontSize="$5">Recent Projects</H4>
                <Button
                  size="$2"
                  chromeless
                  color="$accent"
                  iconAfter={<ChevronRight size={16} />}
                >
                  See All
                </Button>
              </XStack>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                <ProjectCard
                  title="Neon City Vibes"
                  instrument="Synthwave"
                  time="2h ago"
                  color="#8B5CF6"
                />
                <ProjectCard
                  title="Midnight Jazz"
                  instrument="Saxophone"
                  time="5h ago"
                  color="#F59E0B"
                />
                <ProjectCard
                  title="Rock Anthem"
                  instrument="Electric Guitar"
                  time="1d ago"
                  color="#EF4444"
                />
                <ProjectCard
                  title="Lo-Fi Study"
                  instrument="Piano"
                  time="2d ago"
                  color="#10B981"
                />
              </ScrollView>
            </YStack>

            {/* 4. Quick Actions / Inspiration */}
            <YStack paddingHorizontal="$4" gap="$3">
              <H4 fontSize="$5">Explore Sounds</H4>
              <YStack gap="$3">
                <ActionRow
                  icon={Sparkles}
                  title="AI Jam Session"
                  subtitle="Create a backing track with AI"
                  color="$pink10"
                />
                <ActionRow
                  icon={Disc}
                  title="Import Samples"
                  subtitle="Use your own loops and beats"
                  color="$blue10"
                />
                <ActionRow
                  icon={Music}
                  title="Instrument Library"
                  subtitle="Browse 50+ available sounds"
                  color="$orange10"
                />
              </YStack>
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    </Theme>
  );
}

// --- [Sub Components for Demo UI] ---

const ProjectCard = ({
  title,
  instrument,
  time,
  color,
}: {
  title: string;
  instrument: string;
  time: string;
  color: string;
}) => (
  <YStack
    width={160}
    height={180}
    backgroundColor="$dark2"
    borderRadius="$4"
    padding="$3"
    justifyContent="space-between"
    borderWidth={1}
    borderColor="$dark3"
    pressStyle={{ opacity: 0.9, scale: 0.98 }}
  >
    <YStack>
      <Circle size={40} backgroundColor={color} opacity={0.2} marginBottom="$2">
        <Music size={20} color={color} opacity={1} />
      </Circle>
      <Text color="$color" fontWeight="bold" fontSize="$4" numberOfLines={1}>
        {title}
      </Text>
      <Text color="$grayText" fontSize="$2">
        {instrument}
      </Text>
    </YStack>

    <XStack justifyContent="space-between" alignItems="center">
      <XStack gap="$1" alignItems="center">
        <Clock size={12} color="$grayText" />
        <Text color="$grayText" fontSize="$2">
          {time}
        </Text>
      </XStack>
      <Circle size={24} backgroundColor="$dark3">
        <Play size={10} color="white" fill="white" />
      </Circle>
    </XStack>
  </YStack>
);

const ActionRow = ({
  icon: Icon,
  title,
  subtitle,
  color,
}: {
  icon: any;
  title: string;
  subtitle: string;
  color: string;
}) => (
  <XStack
    backgroundColor="$dark2"
    borderRadius="$4"
    padding="$3"
    alignItems="center"
    gap="$3"
    borderWidth={1}
    borderColor="$dark3"
    pressStyle={{ backgroundColor: "$dark3" }}
  >
    <SquareIcon icon={Icon} color={color} />
    <YStack flex={1}>
      <Text color="$color" fontWeight="bold" fontSize="$4">
        {title}
      </Text>
      <Text color="$grayText" fontSize="$3">
        {subtitle}
      </Text>
    </YStack>
    <ChevronRight size={20} color="$grayText" />
  </XStack>
);

const SquareIcon = ({ icon: Icon, color }: { icon: any; color: string }) => (
  <YStack
    width={48}
    height={48}
    borderRadius="$3"
    backgroundColor={color}
    alignItems="center"
    justifyContent="center"
    opacity={0.2} // 배경 투명도
  >
    <Icon size={24} color={color} opacity={1} />
    <YStack position="absolute" opacity={5}>
      <Icon size={24} color={color} />
    </YStack>
  </YStack>
);
