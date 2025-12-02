import { useEffect } from "react";
import { useFonts } from "expo-font";
import { GlobalRecordButton } from "../components/GlobalRecordButton";
import { SplashScreen, Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TamaguiProvider, Theme } from "tamagui";
import config from "../tamagui.config";
import { Provider } from "../components/Provider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider>
        <Stack screenOptions={{ headerShown: false }} />
        <GlobalRecordButton />
      </Provider>
    </GestureHandlerRootView>
  );
}
