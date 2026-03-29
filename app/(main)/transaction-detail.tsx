import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  transactionService,
  type FuelTransaction,
} from "../../services/transaction.service";
import { historyService } from "../../services/history.service";
import { getUnitPrice } from "../../services/price.util";
import { useTheme } from "../../context/theme-context";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams<{
    transaction: string;
    staffId: string;
  }>();

  const [transaction, setTransaction] = useState<FuelTransaction>(() => {
    try {
      return JSON.parse(params.transaction ?? "{}") as FuelTransaction;
    } catch {
      return {} as FuelTransaction;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"fill" | "verify" | null>(null);
  const staffId = params.staffId ?? "";

  const doMarkFilled = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setConfirmAction(null);
      const updated = await transactionService.markFilled(transaction.id, staffId);
      setTransaction(updated);
      const filledAt = new Date().toISOString();
      await historyService.addEntry({
        transactionNo: updated.transactionNo,
        transactionId: updated.id,
        action: "FILLED",
        fuelType: updated.fuelType,
        quantity: updated.quantity,
        totalAmount: updated.totalAmount,
        customerName: updated.customer?.name,
        customerPhone: updated.customer?.phone,
        stationName: updated.station?.name,
        pricePerLiter: getUnitPrice(updated),
        staffProfileId: staffId ?? null,
        paymentStatus: updated.status,
        notes: updated.notes,
        filledAt,
        timestamp: filledAt,
        transaction: updated,
      });
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      setErrorMsg(
        axiosError.response?.data?.message ?? "Failed to update status."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filledStatus = transaction.fuelFilledStatus ?? "NOT_FILLED";
  const isNotFilled = filledStatus === "NOT_FILLED";
  const isFilled = filledStatus === "FILLED";
  const isConfirmingFill = confirmAction === "fill";

  const statusConfig: Record<
    string,
    { label: string; color: string; bg: string; icon: IconName }
  > = {
    NOT_FILLED: {
      label: "Not Filled",
      color: theme.warning,
      bg: `${theme.warning}15`,
      icon: "clock-outline",
    },
    FILLED: {
      label: "Fuel Dispensed",
      color: theme.success,
      bg: `${theme.success}15`,
      icon: "check-circle-outline",
    },
  };

  const statusInfo = statusConfig[filledStatus] ?? statusConfig["NOT_FILLED"];
  const fuelTypeColor =
    transaction.fuelType === "PETROL" ? theme.success : theme.accent;

  const unitPrice = getUnitPrice(transaction);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        <MaterialCommunityIcons name={icon} size={16} color={theme.subText} />
        <Text style={[styles.rowLabel, { color: theme.subText }]}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, { color: valueColor || theme.text }]}>
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
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction Details</Text>
          <Text style={[styles.headerSub, { color: theme.subText }]}>
            {transaction.transactionNo ?? "—"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: statusInfo.bg,
              borderColor: statusInfo.color + "40",
            },
          ]}
        >
          <MaterialCommunityIcons name={statusInfo.icon} size={32} color={statusInfo.color} />
          <View>
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            <Text style={[styles.statusDesc, { color: theme.text }]}>Fuel Fill Status</Text>
          </View>
        </View>

        {/* Fuel Info */}
        <View style={[styles.fuelCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={[styles.fuelIconWrap, { backgroundColor: theme.bg }]}>
            <MaterialCommunityIcons name="fuel" size={28} color={fuelTypeColor} />
          </View>
          <View style={styles.fuelInfo}>
            <Text style={[styles.fuelType, { color: fuelTypeColor }]}>
              {transaction.fuelType ?? "—"}
            </Text>
            <Text style={[styles.fuelQty, { color: theme.subText }]}>
              {transaction.quantity?.toFixed(2) ?? "0.00"} Liters
            </Text>
          </View>
          <View style={styles.fuelAmount}>
            <Text style={[styles.amountLabel, { color: theme.subText }]}>Total</Text>
            <Text style={[styles.amountValue, { color: theme.text }]}>
              Rs. {transaction.totalAmount?.toFixed(2) ?? "0.00"}
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.subText }]}>Transaction Info</Text>
          <Row icon="identifier" label="Transaction No" value={transaction.transactionNo ?? "—"} />
          <Row icon="currency-inr" label="Price/Liter" value={`Rs. ${Number(unitPrice).toFixed(2) ?? "0.00"}`} />
          <Row icon="check-circle-outline" label="Payment Status" value={transaction.status ?? "—"} valueColor={theme.success} />
          <Row icon="calendar-outline" label="Date" value={formatDate(transaction.createdAt)} />
        </View>

        {/* Customer Card */}
        {transaction.customer && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.subText }]}>Customer</Text>
            <Row icon="account-outline" label="Name" value={transaction.customer.name ?? "—"} />
            {transaction.customer.phone && (
              <Row icon="phone-outline" label="Phone" value={transaction.customer.phone} />
            )}
          </View>
        )}

        {/* Notes */}
        {transaction.notes && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.subText }]}>Notes</Text>
            <Text style={[styles.notesText, { color: theme.subText }]}>{transaction.notes}</Text>
          </View>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <View style={[styles.errorBanner, { backgroundColor: `${theme.danger}15`, borderColor: `${theme.danger}40` }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => setErrorMsg(null)}>
              <MaterialCommunityIcons name="close" size={16} color={theme.danger} />
            </TouchableOpacity>
          </View>
        )}

        {/* Inline Confirm: Fill */}
        {isConfirmingFill && (
          <View style={[styles.confirmCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <MaterialCommunityIcons name="gas-station" size={24} color={theme.primary} />
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Confirm Fuel Dispensed</Text>
            <Text style={[styles.confirmDesc, { color: theme.subText }]}>
              Mark{" "}
              <Text style={{ color: theme.text, fontWeight: "700" }}>
                {transaction.quantity?.toFixed(2)}L {transaction.fuelType}
              </Text>{" "}
              as filled for{" "}
              <Text style={{ color: theme.text, fontWeight: "700" }}>
                {transaction.customer?.name ?? "this customer"}
              </Text>
              ?
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                onPress={() => setConfirmAction(null)}
              >
                <Text style={[styles.confirmCancelText, { color: theme.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmOkBtn, { backgroundColor: theme.primary }]}
                onPress={() => void doMarkFilled()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmOkText}>Yes, Mark Filled</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {isNotFilled && !isConfirmingFill && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              onPress={() => setConfirmAction("fill")}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="gas-station" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Mark as Filled</Text>
            </TouchableOpacity>
          )}

          {isFilled && (
            <View style={[styles.filledBox, { backgroundColor: `${theme.success}10`, borderColor: `${theme.success}30` }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color={theme.success} />
              <Text style={[styles.filledText, { color: theme.success }]}>Fuel dispensed successfully</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.scanAgainBtn, { borderColor: theme.accent }]}
            onPress={() => router.replace("/(main)/scan")}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={theme.accent} />
            <Text style={[styles.actionBtnText, { color: theme.accent }]}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },

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
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSub: { fontSize: 12, textAlign: "center" },

  /* status */
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  statusLabel: { fontSize: 18, fontWeight: "700" },
  statusDesc: { fontSize: 12, marginTop: 2, opacity: 0.8 },

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
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  fuelInfo: { flex: 1 },
  fuelType: { fontSize: 17, fontWeight: "700" },
  fuelQty: { fontSize: 13, marginTop: 2 },
  fuelAmount: { alignItems: "flex-end" },
  amountLabel: { fontSize: 11 },
  amountValue: { fontSize: 18, fontWeight: "700" },

  /* card */
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 2,
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
    marginBottom: 10,
  },

  /* row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabel: { fontSize: 13 },
  rowValue: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "55%",
  },

  /* notes */
  notesText: { fontSize: 14, lineHeight: 20 },

  /* error banner */
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 13 },

  /* confirm card */
  confirmCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 10,
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  confirmDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  confirmBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    width: "100%",
  },
  confirmCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  confirmCancelText: { fontSize: 14, fontWeight: "600" },
  confirmOkBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmOkText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  /* actions */
  actions: { gap: 10, marginTop: 4 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    height: 54,
  },
  scanAgainBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  actionBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  /* filled — final state */
  filledBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    height: 54,
    borderWidth: 1,
  },
  filledText: { fontWeight: "600", fontSize: 14 },
});
