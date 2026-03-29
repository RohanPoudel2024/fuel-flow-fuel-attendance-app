import { Tabs, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "../../context/theme-context";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const tabs: {
    name: string;
    label: string;
    icon: IconName;
    activeIcon: IconName;
  }[] = [
    {
      name: "scan",
      label: "Scan QR",
      icon: "qrcode-scan",
      activeIcon: "qrcode-scan",
    },
    {
      name: "history",
      label: "History",
      icon: "history",
      activeIcon: "history",
    },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={[styles.tabBar, { backgroundColor: theme.surface, borderTopColor: theme.cardBorder }]}>
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        const color = isFocused ? theme.primary : theme.subText;
        const bgColor = isFocused ? `${theme.primary}15` : "transparent";

        return (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tabItem, { backgroundColor: bgColor }]}
            onPress={() => {
              if (!isFocused) {
                navigation.navigate(tab.name);
              }
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name={tab.icon} size={22} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}

      {/* Profile button */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("/profile")}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="account-circle-outline"
          size={22}
          color={theme.subText}
        />
        <Text style={[styles.tabLabel, { color: theme.subText }]}>Profile</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default function MainLayout() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.bg } }}
      >
        <Tabs.Screen name="scan" />
        <Tabs.Screen name="history" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: 6,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
