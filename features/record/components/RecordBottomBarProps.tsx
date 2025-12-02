import { Mic } from "@tamagui/lucide-icons";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, YStack } from "tamagui";

interface RecordBottomBarProps {
  onOpenSheet: () => void;
  visible?: boolean; // Control button visibility
}

export const RecordBottomBar = ({
  onOpenSheet,
  visible = true,
}: RecordBottomBarProps) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <YStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      height={insets.bottom + 80}
      bg="$dark2"
      borderTopWidth={1}
      borderTopColor="$dark3"
      ai="center"
      justifyContent="flex-start"
      pt="$4"
    >
      <Button
        size="$6"
        circular
        backgroundColor="$accent"
        pressStyle={{ scale: 0.95, backgroundColor: "$accentPress" }}
        onPress={onOpenSheet}
        elevation="$4"
      >
        <Mic size={28} color="white" />
      </Button>
    </YStack>
  );
};
