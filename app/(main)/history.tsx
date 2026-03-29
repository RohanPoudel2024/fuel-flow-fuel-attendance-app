import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  historyService,
  type HistoryEntry,
} from "../../services/history.service";
import { authService } from "../../services/auth.service";
import { useTheme } from "../../context/theme-context";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    const data = await historyService.getAll();
    try {
      const user = await authService.getUser();
      const staffId = user?.staffProfileId ?? null;
      const filtered = staffId
        ? data.filter((e) => e.staffProfileId === staffId)
        : data;
      setEntries(filtered);
    } catch {
      setEntries(data);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const fuelTypeColor = (type: string) =>
    type === "PETROL" ? theme.success : theme.accent;

  const HistoryItem = ({ item }: { item: HistoryEntry }) => {
    const fuelColor = fuelTypeColor(item.fuelType);
    const fuelIcon: IconName = item.fuelType === "PETROL" ? "leaf" : "fire";

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
        activeOpacity={0.75}
        onPress={() =>
          router.push({
            pathname: "/history-detail",
            params: { entry: JSON.stringify(item) },
          })
        }
      >
        {/* Left: fuel icon */}
        <View style={[styles.fuelIconWrap, { backgroundColor: fuelColor + "15" }]}>
          <MaterialCommunityIcons name={fuelIcon} size={22} color={fuelColor} />
        </View>

        {/* Middle: info */}
        <View style={styles.info}>
          <View style={styles.infoTop}>
            <Text style={[styles.txNo, { color: theme.text }]} numberOfLines={1}>
              {item.transactionNo}
            </Text>
            <View style={[styles.filledBadge, { backgroundColor: `${theme.success}15`, borderColor: `${theme.success}40` }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={11} color={theme.success} />
              <Text style={[styles.filledBadgeText, { color: theme.success }]}>FILLED</Text>
            </View>
          </View>
          <View style={styles.infoMid}>
            <Text style={[styles.fuelLabel, { color: fuelColor }]}>
              {item.fuelType}
            </Text>
            <Text style={[styles.dot, { color: theme.subText }]}>·</Text>
            <Text style={[styles.quantity, { color: theme.subText }]}>{item.quantity.toFixed(2)} L</Text>
            {item.customerName ? (
              <>
                <Text style={[styles.dot, { color: theme.subText }]}>·</Text>
                <Text style={[styles.customer, { color: theme.subText }]} numberOfLines={1}>
                  {item.customerName}
                </Text>
              </>
            ) : null}
          </View>
          <Text style={[styles.time, { color: theme.subText }]}>
            {formatDate(item.filledAt ?? item.timestamp)}
          </Text>
        </View>

        {/* Right: amount + chevron */}
        <View style={styles.right}>
          <Text style={[styles.amount, { color: theme.text }]}>Rs. {item.totalAmount.toFixed(0)}</Text>
          <Text style={[styles.relative, { color: theme.subText }]}>{formatRelative(item.timestamp)}</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={theme.subText} />
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: theme.surface }]}>
        <MaterialCommunityIcons name="history" size={48} color={theme.subText} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No history yet</Text>
      <Text style={[styles.emptyDesc, { color: theme.subText }]}>
        Transactions you mark as filled will appear here.
      </Text>
      <TouchableOpacity
        style={[styles.emptyScanBtn, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40` }]}
        onPress={() => router.replace("/scan")}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="qrcode-scan" size={18} color={theme.primary} />
        <Text style={[styles.emptyScanText, { color: theme.primary }]}>Scan a QR Code</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>History</Text>
          {entries.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}50` }]}>
              <Text style={[styles.countText, { color: theme.primary }]}>{entries.length}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.headerSub, { color: theme.subText }]}>Fuel fills by you</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item, i) => `${item.transactionId}-${i}`}
        renderItem={({ item }) => <HistoryItem item={item} />}
        contentContainerStyle={[
          styles.listContent,
          entries.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  countText: { fontSize: 13, fontWeight: "700" },
  headerSub: { fontSize: 13, fontWeight: "500" },

  listContent: { padding: 16, paddingBottom: 32 },
  listContentEmpty: { flex: 1 },
  separator: { height: 10 },

  /* card */
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fuelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1, gap: 3 },
  infoTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  txNo: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  filledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  filledBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoMid: { flexDirection: "row", alignItems: "center", gap: 4 },
  fuelLabel: { fontSize: 12, fontWeight: "700" },
  dot: { fontSize: 12 },
  quantity: { fontSize: 12, fontWeight: "500" },
  customer: { fontSize: 12, flex: 1, fontWeight: "500" },
  time: { fontSize: 11, marginTop: 2, fontWeight: "500" },

  right: { alignItems: "flex-end", gap: 3, flexShrink: 0 },
  amount: { fontSize: 16, fontWeight: "700" },
  relative: { fontSize: 11, fontWeight: "500" },

  /* empty */
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  emptyScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyScanText: { fontSize: 15, fontWeight: "700" },
});
