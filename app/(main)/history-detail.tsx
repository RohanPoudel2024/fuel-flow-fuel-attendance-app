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

  const calcUnitPrice = tx.pricePerLiter || (tx.totalAmount && tx.quantity ? tx.totalAmount / tx.quantity : 0);
  const displayUnitPrice = calcUnitPrice > 0 ? calcUnitPrice : 0;

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
        {/* Main Hero: Amount & Fuel Type */}
        <View style={styles.heroSection}>
          <View style={styles.heroFuelType}>
            <MaterialCommunityIcons name={fuelIcon} size={24} color={fuelTypeColor} />
            <Text style={[styles.heroFuelLabel, { color: fuelTypeColor }]}>{tx.fuelType ?? "—"}</Text>
          </View>
          <Text style={[styles.heroAmount, { color: theme.text }]}>
            Rs. {tx.totalAmount?.toFixed(2) ?? "0.00"}
          </Text>
          <Text style={[styles.heroQty, { color: theme.subText }]}>
            {tx.quantity?.toFixed(2) ?? "0.00"} Liters @ Rs. {displayUnitPrice.toFixed(2)}/L
          </Text>
        </View>

        {/* Seamless Details List */}
        <View style={styles.detailsList}>
          <Text style={[styles.listSectionTitle, { color: theme.subText }]}>TRANSACTION DETAILS</Text>
          
          <Row icon="identifier" label="Transaction No" value={tx.transactionNo ?? "—"} />
          <Row icon="currency-inr" label="Price / Liter" value={`Rs. ${displayUnitPrice.toFixed(2)}`} />
          <Row icon="calendar-outline" label="Transaction Date" value={formatDate(tx.createdAt)} />
          <Row icon="check-decagram-outline" label="Payment Status" value={tx.status ?? "—"} valueColor={tx.status === "COMPLETED" ? theme.success : theme.warning} />
          
          <View style={[styles.statusRow, { borderBottomColor: theme.bg }]}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="gas-station-outline" size={16} color={theme.subText} />
              <Text style={[styles.rowLabel, { color: theme.subText }]}>Fill Status</Text>
            </View>
            <View style={[styles.badgeInline, { backgroundColor: `${theme.success}15`, borderColor: theme.success + "40" }]}>
              <MaterialCommunityIcons name="check-circle" size={12} color={theme.success} />
              <Text style={[styles.badgeInlineText, { color: theme.success }]}>FILLED</Text>
            </View>
          </View>
          <Row icon="clock-check-outline" label="Filled At" value={formatDate(entry.filledAt ?? entry.timestamp)} />

          {/* Station Info */}
          {tx.station && (
            <>
              <Text style={[styles.listSectionTitle, { color: theme.subText, marginTop: 24 }]}>STATION INFO</Text>
              <Row icon="gas-station-outline" label="Name" value={tx.station.name ?? "—"} />
              {tx.station.location ? (
                <Row icon="map-marker-outline" label="Location" value={tx.station.location} />
              ) : null}
            </>
          )}

          {/* Customer Info */}
          {tx.customer && (
            <>
              <Text style={[styles.listSectionTitle, { color: theme.subText, marginTop: 24 }]}>CUSTOMER INFO</Text>
              <Row icon="account-outline" label="Name" value={tx.customer.name ?? "—"} />
              {tx.customer.phone && (
                <Row icon="phone-outline" label="Phone" value={tx.customer.phone} />
              )}
            </>
          )}

          {/* Payment Receipts */}
          {tx.paymentReceipts && tx.paymentReceipts.length > 0 && (
            <>
              <Text style={[styles.listSectionTitle, { color: theme.subText, marginTop: 24 }]}>PAYMENT RECEIPTS</Text>
              {tx.paymentReceipts.map((r, i) => (
                <Row key={i} icon="receipt" label={`Receipt #${i + 1}`} value={r.receiptNo} />
              ))}
            </>
          )}

          {/* Notes */}
          {tx.notes && (
            <>
              <Text style={[styles.listSectionTitle, { color: theme.subText, marginTop: 24 }]}>NOTES</Text>
              <Text style={[styles.notesText, { color: theme.text }]}>{tx.notes}</Text>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.backHistoryBtn, { borderColor: theme.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.primary} />
            <Text style={[styles.backHistoryText, { color: theme.primary }]}>Back to History</Text>
          </TouchableOpacity>
        </View>
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

  /* Main Hero */
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    marginBottom: 8,
  },
  heroFuelType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  heroFuelLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroQty: {
    fontSize: 15,
    fontWeight: "500",
  },

  /* Details List */
  detailsList: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { fontSize: 14, fontWeight: "500" },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    maxWidth: "50%",
    textAlign: "right",
  },
  badgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeInlineText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 4,
    fontWeight: "500",
  },

  /* actions */
  actions: { gap: 10, marginTop: 4 },
  backHistoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  backHistoryText: { fontSize: 16, fontWeight: "700" },
});
