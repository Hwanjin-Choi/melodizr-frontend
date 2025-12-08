import { useColorScheme } from "react-native";
import { TamaguiProvider, Theme } from "tamagui";
import config from "../tamagui.config";
import { PortalProvider } from "@tamagui/portal";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export function Provider({ children, ...rest }) {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={colorScheme === "dark" ? "dark" : "light"}
    >
      <BottomSheetModalProvider>
        <PortalProvider>
          <Theme name={colorScheme === "dark" ? "dark" : "light"}>
            {children}
          </Theme>
        </PortalProvider>
      </BottomSheetModalProvider>
    </TamaguiProvider>
  );
}
