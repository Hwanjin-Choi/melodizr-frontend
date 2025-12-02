import { useColorScheme } from "react-native";
import { PortalProvider, TamaguiProvider, Theme } from "tamagui";
import config from "../tamagui.config";

export function Provider({ children, ...rest }) {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={colorScheme === "dark" ? "dark" : "light"}
    >
      <PortalProvider shouldAddRootHost>
        <Theme name={colorScheme === "dark" ? "dark" : "light"}>
          {children}
        </Theme>
      </PortalProvider>
    </TamaguiProvider>
  );
}
