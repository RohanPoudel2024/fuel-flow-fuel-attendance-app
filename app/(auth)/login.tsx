import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authService } from "../../services/auth.service";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your email and password");
      return;
    }

    try {
      setIsLoading(true);
      await authService.login(email.trim(), password);
      router.replace("/(main)/scan");
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const message =
        axiosError.response?.data?.message ||
        "Login failed. Please check your credentials.";
      Alert.alert(
        "Login Failed",
        Array.isArray(message) ? message[0] : (message as string),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <MaterialCommunityIcons
                name="gas-station"
                size={52}
                color="#FB923C"
              />
            </View>
            <Text style={styles.appName}>Fuel Flow</Text>
            <Text style={styles.tagline}>Attendance Portal</Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <MaterialCommunityIcons
                name="shield-account"
                size={14}
                color="#FB923C"
              />
              <Text style={styles.badgeText}>Station Staff Only</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSub}>
              Use your station staff credentials
            </Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="staff@station.com"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="login" size={18} color="#fff" />
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            For station admins and staff only.{"\n"}
            Contact your administrator for access.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: "center",
  },

  /* header */
  header: { alignItems: "center", marginBottom: 20 },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F1F5F9",
    letterSpacing: 0.5,
  },
  tagline: { fontSize: 14, color: "#64748B", marginTop: 4 },

  /* badge */
  badgeRow: { alignItems: "center", marginBottom: 24 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  badgeText: { fontSize: 12, color: "#FB923C", fontWeight: "600" },

  /* card */
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F1F5F9",
    marginBottom: 4,
  },
  formSub: { fontSize: 13, color: "#64748B", marginBottom: 24 },

  /* fields */
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#94A3B8", marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    height: 48,
    color: "#F1F5F9",
    fontSize: 15,
  },
  eyeBtn: { padding: 4 },

  /* button */
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FB923C",
    borderRadius: 12,
    height: 52,
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  /* footer */
  footer: {
    textAlign: "center",
    color: "#475569",
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
});
