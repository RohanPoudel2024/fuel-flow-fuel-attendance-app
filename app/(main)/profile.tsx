import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authService, type StationUser } from "../../services/auth.service";
import { useTheme } from "../../context/theme-context";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState<StationUser | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      const u = await authService.getUser();
      setUser(u);
    };
    void load();
  }, []);

  const doLogout = async () => {
    await authService.logout();
    router.replace("/(auth)/login");
  };

  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: IconName;
    label: string;
    value: string;
  }) => (
    <View style={[styles.infoRow, { borderBottomColor: theme.bg }]}>
      <View style={[styles.infoIconWrap, { backgroundColor: `${theme.primary}15` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: theme.subText }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );

  const roleLabel =
    user?.userType === "STATION_ADMIN" ? "Station Admin" : "Station Staff";
  const roleColor = user?.userType === "STATION_ADMIN" ? theme.info : theme.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.surface }]}
          onPress={() => router.replace("/(main)/scan")}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <MaterialCommunityIcons name="account" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{user?.name ?? "—"}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${roleColor}10`, borderColor: `${roleColor}40` }]}>
            <MaterialCommunityIcons
              name={
                user?.userType === "STATION_ADMIN"
                  ? "shield-crown-outline"
                  : "account-hard-hat-outline"
              }
              size={13}
              color={roleColor}
            />
            <Text style={[styles.roleText, { color: roleColor }]}>
              {roleLabel}
            </Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.subText }]}>Account Info</Text>
          <InfoRow
            icon="email-outline"
            label="Email"
            value={user?.email ?? "—"}
          />
          {user?.phone && (
            <InfoRow icon="phone-outline" label="Phone" value={user.phone} />
          )}
          <InfoRow
            icon="badge-account-outline"
            label="Role"
            value={roleLabel}
          />
        </View>

        {/* Station Info */}
        {user?.station && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.subText }]}>Station</Text>
            <InfoRow
              icon="gas-station-outline"
              label="Station Name"
              value={user.station.name}
            />
            <InfoRow
              icon="map-marker-outline"
              label="Location"
              value={user.station.location}
            />
          </View>
        )}

        {/* Appearance Settings */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.subText }]}>Appearance</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={toggleTheme}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? `${theme.warning}15` : `${theme.secondary}15` }]}>
              <MaterialCommunityIcons 
                name={isDark ? "white-balance-sunny" : "moon-waning-crescent"} 
                size={20} 
                color={isDark ? theme.warning : theme.secondary} 
              />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>
              {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </Text>
            <MaterialCommunityIcons name="theme-light-dark" size={20} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.subText }]}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.replace("/(main)/scan")}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${theme.info}15` }]}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color={theme.info} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>Scan QR Code</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.subText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.replace("/(main)/history")}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${theme.accent}15` }]}>
              <MaterialCommunityIcons name="history" size={20} color={theme.accent} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>View Fill History</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* Logout confirm or button */}
        {showLogoutConfirm ? (
          <View style={[styles.logoutConfirmCard, { backgroundColor: theme.surface, borderColor: `${theme.danger}40` }]}>
            <MaterialCommunityIcons name="logout" size={22} color={theme.danger} />
            <Text style={[styles.logoutConfirmTitle, { color: theme.text }]}>Sign out?</Text>
            <Text style={[styles.logoutConfirmDesc, { color: theme.subText }]}>
              You will need to log in again to access the app.
            </Text>
            <View style={styles.logoutConfirmBtns}>
              <TouchableOpacity
                style={[styles.logoutCancelBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={[styles.logoutCancelText, { color: theme.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.logoutOkBtn, { backgroundColor: `${theme.danger}15`, borderColor: `${theme.danger}50` }]} onPress={() => void doLogout()}>
                <Text style={[styles.logoutOkText, { color: theme.danger }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: `${theme.danger}10`, borderColor: `${theme.danger}30` }]}
            onPress={() => setShowLogoutConfirm(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="logout" size={18} color={theme.danger} />
            <Text style={[styles.logoutText, { color: theme.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },

  /* header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },

  /* avatar */
  avatarSection: { alignItems: "center", paddingVertical: 24, gap: 10 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  name: { fontSize: 22, fontWeight: "700" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: { fontSize: 13, fontWeight: "600" },

  /* card */
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  /* info row */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11 },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 1,
  },

  /* action row */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, fontSize: 14, fontWeight: "600" },

  /* logout */
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    height: 54,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "700" },

  /* logout confirm card */
  logoutConfirmCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  logoutConfirmTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  logoutConfirmDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  logoutConfirmBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    width: "100%",
  },
  logoutCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logoutCancelText: { fontSize: 14, fontWeight: "600" },
  logoutOkBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logoutOkText: { fontSize: 14, fontWeight: "700" },
});
