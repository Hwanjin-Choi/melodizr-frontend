import { Home, Music, User } from "@tamagui/lucide-icons";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

export default function TabLayout() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.dark2?.val || "#1E1E1E",
          borderTopColor: theme.dark3?.val || "#333",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 5,

          paddingTop: 5,
        },
        tabBarActiveTintColor: theme.accent?.val || "#FF8C00",
        tabBarInactiveTintColor: theme.grayText?.val || "#888",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="myproject"
        options={{
          title: "Project",
          tabBarIcon: ({ color }) => <Music color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="mypage"
        options={{
          title: "My Page",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
