import { Mic } from "@tamagui/lucide-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "tamagui";

export function GlobalRecordButton() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (pathname === "/record") return null;

  return (
    <Button
      position="absolute"
      bottom={insets.bottom + 80}
      right={20}
      zIndex={9999}
      size="$6"
      circular
      backgroundColor="$accent"
      elevation="$5"
      shadowColor="black"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.3}
      shadowRadius={4}
      pressStyle={{ backgroundColor: "$accentPress" }}
      onPress={() => router.push("/record")}
      icon={<Mic size={28} color="white" />}
    />
  );
}
