import { ArrowLeft } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Button, Separator, Text, XStack, YStack } from "tamagui";

interface RecordHeaderProps {
  isProject: boolean;
  onTabChange: (isProject: boolean) => void;
}

export const RecordHeader = ({ isProject, onTabChange }: RecordHeaderProps) => {
  const router = useRouter();

  return (
    <>
      <XStack ai="center" px="$4" py="$3" gap="$4">
        <Button size="$3" circular unstyled onPress={() => router.back()}>
          <ArrowLeft color="$color" />
        </Button>

        <XStack f={1} jc="center" gap="$6" mr="$8">
          <TabButton
            label="Project"
            isActive={isProject}
            onPress={() => onTabChange(true)}
          />
          <TabButton
            label="Voice"
            isActive={!isProject}
            onPress={() => onTabChange(false)}
          />
        </XStack>
      </XStack>
      <Separator borderColor="$dark3" />
    </>
  );
};

const TabButton = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <YStack onPress={onPress} ai="center" gap="$2">
    <Text
      color={isActive ? "$accent" : "$grayText"}
      fontWeight={isActive ? "bold" : "normal"}
      fontSize="$5"
    >
      {label}
    </Text>
    <YStack
      width="100%"
      height={3}
      bg={isActive ? "$accent" : "transparent"}
      borderRadius={2}
    />
  </YStack>
);
