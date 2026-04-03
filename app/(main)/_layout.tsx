import { Tabs, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "../../context/theme-context";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const tabs: { name: string; label: string; icon: IconName }[] = [
    { name: "scan", label: "Scan", icon: "qrcode-scan" },
    { name: "history", label: "History", icon: "history" },
  ];

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[
        styles.tabBar,
        { backgroundColor: theme.surface, borderTopColor: theme.divider },
      ]}
    >
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        const color = isFocused ? theme.primary : theme.subText;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              if (!isFocused) navigation.navigate(tab.name);
            }}
            activeOpacity={0.75}
          >
            {isFocused && (
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: theme.primaryLight },
                ]}
              />
            )}
            <MaterialCommunityIcons name={tab.icon} size={23} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("/profile")}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name="account-circle-outline"
          size={23}
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
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: theme.bg },
        }}
      >
        <Tabs.Screen name="scan" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="transaction-detail" options={{ href: null }} />
        <Tabs.Screen name="history-detail" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 6,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 14,
    gap: 3,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: 4,
    left: 8,
    right: 8,
    bottom: 4,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
