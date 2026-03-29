import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { HistoryEntry } from "../../services/history.service";
import type { FuelTransaction } from "../../services/transaction.service";
import { useTheme } from "../../context/theme-context";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams<{ entry: string }>();

  const [entry] = useState<HistoryEntry>(() => {
    try {
      return JSON.parse(params.entry ?? "{}") as HistoryEntry;
    } catch {
      return {} as HistoryEntry;
    }
  });

  const tx = (entry.transaction ?? {
    id: entry.transactionId,
    transactionNo: entry.transactionNo,
    fuelType: entry.fuelType,
    quantity: entry.quantity,
    pricePerLiter: entry.pricePerLiter ?? 0,
    totalAmount: entry.totalAmount,
    status: entry.paymentStatus ?? "—",
    fuelFilledStatus: "FILLED" as const,
    notes: entry.notes,
    createdAt: entry.filledAt ?? entry.timestamp,
    customer: entry.customerName
      ? { name: entry.customerName, phone: entry.customerPhone }
      : undefined,
    station: entry.stationName
      ? { name: entry.stationName, location: "" }
      : undefined,
  }) as FuelTransaction;

  const fuelTypeColor = tx.fuelType === "PETROL" ? theme.success : theme.accent;
  const fuelIcon: IconName = tx.fuelType === "PETROL" ? "leaf" : "fire";

  const Row = ({
    icon,
    label,
    value,
    valueColor,
  }: {
    icon: IconName;
    label: string;
    value: string;
    valueColor?: string;
  }) => (
    <View style={[styles.row, { borderBottomColor: theme.bg }]}>
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons name={icon} size={15} color={theme.subText} />
        <Text style={[styles.rowLabel, { color: theme.subText }]}>{label}</Text>
      </View>
      <Text
        style={[styles.rowValue, { color: valueColor || theme.text }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.surface }]} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Fill Record</Text>
          <Text style={[styles.headerSub, { color: theme.subText }]} numberOfLines={1}>
            {entry.transactionNo ?? "—"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[styles.statusCard, { backgroundColor: `${theme.success}10`, borderColor: `${theme.success}30` }]}>
          <MaterialCommunityIcons
            name="check-circle"
            size={34}
            color={theme.success}
          />
          <View>
            <Text style={[styles.statusLabel, { color: theme.success }]}>Fuel Dispensed</Text>
            <Text style={[styles.statusTime, { color: theme.text }]}>
              Filled {formatDate(entry.filledAt ?? entry.timestamp)}
            </Text>
          </View>
        </View>

        {/* Fuel Summary */}
        <View style={[styles.fuelCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={[styles.fuelIconWrap, { backgroundColor: fuelTypeColor + "15" }]}>
            <MaterialCommunityIcons name={fuelIcon} size={30} color={fuelTypeColor} />
          </View>
          <View style={styles.fuelInfo}>
            <Text style={[styles.fuelType, { color: fuelTypeColor }]}>
              {tx.fuelType ?? "—"}
            </Text>
            <Text style={[styles.fuelQty, { color: theme.subText }]}>
              {tx.quantity?.toFixed(2) ?? "0.00"} Liters
            </Text>
          </View>
          <View style={styles.fuelAmount}>
            <Text style={[styles.amountLabel, { color: theme.subText }]}>Total Paid</Text>
            <Text style={[styles.amountValue, { color: theme.text }]}>
              Rs. {tx.totalAmount?.toFixed(2) ?? "0.00"}
            </Text>
          </View>
        </View>

        {/* Transaction Info */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.subText }]}>Transaction Info</Text>
          <Row icon="identifier" label="Transaction No" value={tx.transactionNo ?? "—"} />
          <Row icon="currency-inr" label="Price / Liter" value={tx.pricePerLiter ? `Rs. ${tx.pricePerLiter.toFixed(2)}` : "—"} />
          <Row icon="check-decagram-outline" label="Payment Status" value={tx.status ?? "—"} valueColor={tx.status === "COMPLETED" ? theme.success : theme.warning} />
          <Row icon="gas-station-outline" label="Fill Status" value="FILLED" valueColor={theme.success} />
          <Row icon="calendar-outline" label="Transaction Date" value={formatDate(tx.createdAt)} />
          <Row icon="clock-check-outline" label="Filled At" value={formatDate(entry.filledAt ?? entry.timestamp)} />
        </View>

        {/* Customer Info */}
        {tx.customer && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.subText }]}>Customer</Text>
            <Row icon="account-outline" label="Name" value={tx.customer.name ?? "—"} />
            {tx.customer.phone && (
              <Row icon="phone-outline" label="Phone" value={tx.customer.phone} />
            )}
          </View>
        )}

        {/* Station Info */}
        {tx.station && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.subText }]}>Station</Text>
            <Row icon="gas-station-outline" label="Name" value={tx.station.name ?? "—"} />
            {tx.station.location ? (
              <Row icon="map-marker-outline" label="Location" value={tx.station.location} />
            ) : null}
          </View>
        )}

        {/* Payment Receipts */}
        {tx.paymentReceipts && tx.paymentReceipts.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.subText }]}>Payment Receipt</Text>
            {tx.paymentReceipts.map((r, i) => (
              <Row key={i} icon="receipt" label={`Receipt #${i + 1}`} value={r.receiptNo} />
            ))}
          </View>
        )}

        {/* Notes */}
        {tx.notes && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.subText }]}>Notes</Text>
            <Text style={[styles.notesText, { color: theme.subText }]}>{tx.notes}</Text>
          </View>
        )}

        {/* Back to History button */}
        <TouchableOpacity
          style={[styles.backHistoryBtn, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}40` }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={theme.primary} />
          <Text style={[styles.backHistoryText, { color: theme.primary }]}>Back to History</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
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
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 1, fontWeight: "500" },

  /* status banner */
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  statusLabel: { fontSize: 18, fontWeight: "700" },
  statusTime: { fontSize: 13, marginTop: 4, fontWeight: "500" },

  /* fuel */
  fuelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fuelIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  fuelInfo: { flex: 1 },
  fuelType: { fontSize: 18, fontWeight: "700" },
  fuelQty: { fontSize: 13, marginTop: 2, fontWeight: "500" },
  fuelAmount: { alignItems: "flex-end" },
  amountLabel: { fontSize: 12, fontWeight: "500" },
  amountValue: { fontSize: 20, fontWeight: "800" },

  /* card */
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  /* row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabel: { fontSize: 13, fontWeight: "500" },
  rowValue: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "55%",
    textAlign: "right",
  },

  /* notes */
  notesText: { fontSize: 14, lineHeight: 22, fontWeight: "500" },

  /* back button */
  backHistoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 8,
  },
  backHistoryText: { fontSize: 16, fontWeight: "700" },
});
