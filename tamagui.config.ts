import { createAnimations } from "@tamagui/animations-react-native";
import { createInterFont } from "@tamagui/font-inter";
import { shorthands } from "@tamagui/shorthands";
import {
  themes as defaultThemes,
  tokens as defaultTokens,
} from "@tamagui/themes";
import { createTamagui, createTokens } from "tamagui";

const animations = createAnimations({
  bouncy: {
    type: "spring",
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: "spring",
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: "spring",
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
});

const headingFont = createInterFont();
const bodyFont = createInterFont();

const tokens = createTokens({
  ...defaultTokens,
  color: {
    ...defaultTokens.color,
    melodizrOrange: "#F97316",
    melodizrOrangePress: "#E67E00",
    dark1: "#121212",
    dark2: "#1E1E1E",
    dark3: "#2C2C2C",
    light1: "#FFFFFF",
    light2: "#F5F5F5",
    light3: "#E0E0E0",
    grayText: "#888888",
  },
});

const darkTheme = {
  ...defaultThemes.dark,
  background: tokens.color.dark1,
  surface: tokens.color.dark2,
  border: tokens.color.dark3,
  color: tokens.color.light1,
  textPrimary: "#FFFFFF",
  textSecondary: tokens.color.grayText,
  accent: tokens.color.melodizrOrange,
  accentPress: tokens.color.melodizrOrangePress,
};

const lightTheme = {
  ...defaultThemes.light,
  background: tokens.color.light1,
  surface: tokens.color.light2,
  border: tokens.color.light3,
  color: tokens.color.dark1,
  textPrimary: tokens.color.dark1,
  textSecondary: tokens.color.grayText,
  accent: tokens.color.melodizrOrange,
  accentPress: tokens.color.melodizrOrangePress,
};

const config = createTamagui({
  animations,
  defaultTheme: "dark",
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes: {
    ...defaultThemes,
    light: lightTheme,
    dark: darkTheme,
  },
  tokens,
});

export default config;

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}
