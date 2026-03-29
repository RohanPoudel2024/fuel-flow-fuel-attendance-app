import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { authService } from "../services/auth.service";
import { useTheme } from "../context/theme-context";

export default function IndexScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await authService.isLoggedIn();
      if (loggedIn) {
        router.replace("/(main)/scan");
      } else {
        router.replace("/(auth)/login");
      }
    };
    void checkAuth();
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
