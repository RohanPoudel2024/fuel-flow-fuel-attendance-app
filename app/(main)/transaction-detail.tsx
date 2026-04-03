import { useState, useEffect } from "react";
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
import { authService, type StationUser } from "../../services/auth.service";
import { API_URL } from "../../config/api.config";

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
  const [activePrice, setActivePrice] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchStationPrices = async () => {
      try {
        const u = await authService.getUser();
        if (!u?.station?.id) return;
        const token = await authService.getToken();
        const res = await fetch(`${API_URL}/station/${u.station.id}/fuel-prices`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const prices = await res.json();
          const p = prices.find((item: any) => item.fuelType === transaction.fuelType);
          if (p && p.pricePerUnit && isMounted) {
            setActivePrice(Number(p.pricePerUnit));
          }
        }
      } catch (err) {
        console.error("Failed to fetch station prices:", err);
      }
    };

    if (getUnitPrice(transaction) === 0) {
      void fetchStationPrices();
    }
    return () => { isMounted = false; };
  }, [transaction.fuelType]);

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

  const baseUnitPrice = getUnitPrice(transaction);
  const finalUnitPrice = baseUnitPrice > 0 ? baseUnitPrice : activePrice;

  // Real-time calculation if not fully synced
  const calcTotalAmount = transaction.totalAmount && transaction.totalAmount > 0 
    ? transaction.totalAmount 
    : (transaction.quantity ?? 0) * finalUnitPrice;

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
        {/* Main Hero: Amount & Fuel Type */}
        <View style={styles.heroSection}>
          <View style={styles.heroFuelType}>
            <MaterialCommunityIcons name={transaction.fuelType === "PETROL" ? "leaf" : "fire"} size={24} color={fuelTypeColor} />
            <Text style={[styles.heroFuelLabel, { color: fuelTypeColor }]}>{transaction.fuelType ?? "—"}</Text>
          </View>
          <Text style={[styles.heroAmount, { color: theme.text }]}>
            Rs. {calcTotalAmount?.toFixed(2) ?? "0.00"}
          </Text>
          <Text style={[styles.heroQty, { color: theme.subText }]}>
            {transaction.quantity?.toFixed(2) ?? "0.00"} Liters @ Rs. {Number(finalUnitPrice).toFixed(2)}/L
          </Text>
        </View>

        {/* Seamless Details List */}
        <View style={styles.detailsList}>
          <Text style={[styles.listSectionTitle, { color: theme.subText }]}>TRANSACTION DETAILS</Text>
          
          <Row icon="identifier" label="Transaction No" value={transaction.transactionNo ?? "—"} />
          <Row icon="currency-inr" label="Price/Liter" value={`Rs. ${Number(finalUnitPrice).toFixed(2) ?? "0.00"}`} />
          <Row icon="calendar-outline" label="Date & Time" value={formatDate(transaction.createdAt)} />
          <Row icon="check-circle-outline" label="Payment Status" value={transaction.status ?? "—"} valueColor={theme.success} />
          
          <View style={[styles.statusRow, { borderBottomColor: theme.bg }]}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="gas-station-outline" size={16} color={theme.subText} />
              <Text style={[styles.rowLabel, { color: theme.subText }]}>Fill Status</Text>
            </View>
            <View style={[styles.badgeInline, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + "40" }]}>
              <MaterialCommunityIcons name={statusInfo.icon} size={12} color={statusInfo.color} />
              <Text style={[styles.badgeInlineText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>

          {transaction.customer && (
            <>
              <Text style={[styles.listSectionTitle, { color: theme.subText, marginTop: 24 }]}>CUSTOMER INFO</Text>
              <Row icon="account-outline" label="Name" value={transaction.customer.name ?? "—"} />
              {transaction.customer.phone && (
                <Row icon="phone-outline" label="Phone" value={transaction.customer.phone} />
              )}
            </>
          )}

          {transaction.notes && (
            <>
              <Text style={[styles.listSectionTitle, { color: theme.subText, marginTop: 24 }]}>NOTES</Text>
              <Text style={[styles.notesText, { color: theme.text }]}>{transaction.notes}</Text>
            </>
          )}
        </View>

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
            style={[styles.actionBtn, styles.scanAgainBtn, { borderColor: theme.primary }]}
            onPress={() => router.replace("/(main)/scan")}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={theme.primary} />
            <Text style={[styles.actionBtnText, { color: theme.primary }]}>Scan Another</Text>
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
  },

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
