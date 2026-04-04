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

  // Sync state when params change
  useEffect(() => {
    if (params.transaction) {
      try {
        setTransaction(JSON.parse(params.transaction) as FuelTransaction);
      } catch (err) {
        console.error("Failed to parse transaction params", err);
      }
    }
  }, [params.transaction]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"fill" | "verify" | null>(
    null,
  );
  const staffId = params.staffId ?? "";
  const [activePrice, setActivePrice] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchStationPrices = async () => {
      try {
        const u = await authService.getUser();
        if (!u?.station?.id) return;
        const token = await authService.getToken();
        const res = await fetch(
          `${API_URL}/station/${u.station.id}/fuel-prices`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        if (res.ok) {
          const prices = await res.json();
          const p = prices.find(
            (item: any) => item.fuelType === transaction.fuelType,
          );
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
    return () => {
      isMounted = false;
    };
  }, [transaction.fuelType]);

  const doMarkFilled = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setConfirmAction(null);
      const qrToken = transaction.paymentReceipts?.[0]?.qrVerificationToken;
      const updated = await transactionService.markFilled(
        transaction.id,
        staffId,
        qrToken,
      );
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
        axiosError.response?.data?.message ?? "Failed to update status.",
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
  const calcTotalAmount =
    transaction.totalAmount && transaction.totalAmount > 0
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
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.subText} />
        <Text style={[styles.rowLabel, { color: theme.subText }]}>{label}</Text>
      </View>
      <Text
        style={[styles.rowValue, { color: valueColor || theme.text }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />

      {/* Header */}
      <View style={[styles.header]}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: theme.surface, borderColor: theme.cardBorder },
          ]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Transaction
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Card */}
        <View
          style={[
            styles.receiptCard,
            { backgroundColor: theme.surface, borderColor: theme.cardBorder },
          ]}
        >
          {/* Header of Receipt */}
          <View
            style={[
              styles.receiptHeader,
              { borderBottomColor: isDark ? "#333" : "#e5e5e5" },
            ]}
          >
            <View
              style={[
                styles.fuelIconWrap,
                { backgroundColor: `${fuelTypeColor}15` },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  transaction.fuelType === "PETROL" ? "gas-station" : "fire"
                }
                size={28}
                color={fuelTypeColor}
              />
            </View>
            <Text style={[styles.heroFuelLabel, { color: theme.subText }]}>
              {transaction.fuelType?.toUpperCase() ?? "FUEL"}
            </Text>
            <Text
              style={[styles.heroAmount, { color: theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Rs. {calcTotalAmount?.toFixed(2) ?? "0.00"}
            </Text>
            <View style={[styles.qtyBadge, { backgroundColor: theme.bg }]}>
              <Text style={[styles.qtyBadgeText, { color: theme.primary }]}>
                {transaction.quantity?.toFixed(2) ?? "0.00"}L @ Rs.{" "}
                {Number(finalUnitPrice).toFixed(2)}/L
              </Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.receiptBody}>
            <Text style={[styles.sectionTitle, { color: theme.subText }]}>
              TRANSACTION DETAILS
            </Text>
            <Row
              icon="identifier"
              label="ID Number"
              value={transaction.transactionNo ?? "—"}
            />
            <Row
              icon="calendar-clock-outline"
              label="Date & Time"
              value={formatDate(transaction.createdAt)}
            />

            <View style={[styles.statusRow]}>
              <View style={styles.rowLeft}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={18}
                  color={theme.subText}
                />
                <Text style={[styles.rowLabel, { color: theme.subText }]}>
                  Payment
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: `${theme.success}15`,
                    borderColor: `${theme.success}30`,
                  },
                ]}
              >
                <Text
                  style={[styles.statusBadgeText, { color: theme.success }]}
                >
                  {transaction.status ?? "—"}
                </Text>
              </View>
            </View>

            <View style={[styles.statusRow]}>
              <View style={styles.rowLeft}>
                <MaterialCommunityIcons
                  name="gas-station-outline"
                  size={18}
                  color={theme.subText}
                />
                <Text style={[styles.rowLabel, { color: theme.subText }]}>
                  Fuel Status
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusInfo.bg,
                    borderColor: statusInfo.color + "40",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={statusInfo.icon}
                  size={12}
                  color={statusInfo.color}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: statusInfo.color, marginLeft: 4 },
                  ]}
                >
                  {statusInfo.label}
                </Text>
              </View>
            </View>

            {transaction.customer && (
              <>
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: isDark ? "#333" : "#e5e5e5" },
                  ]}
                />
                <Text style={[styles.sectionTitle, { color: theme.subText }]}>
                  CUSTOMER INFO
                </Text>
                <Row
                  icon="account-circle-outline"
                  label="Name"
                  value={transaction.customer.name ?? "—"}
                />
                {transaction.customer.phone && (
                  <Row
                    icon="phone-outline"
                    label="Phone"
                    value={transaction.customer.phone}
                  />
                )}
              </>
            )}

            {transaction.notes && (
              <>
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: isDark ? "#333" : "#e5e5e5" },
                  ]}
                />
                <Text style={[styles.sectionTitle, { color: theme.subText }]}>
                  NOTES
                </Text>
                <Text style={[styles.notesText, { color: theme.text }]}>
                  {transaction.notes}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Error Banner */}
        {errorMsg && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: `${theme.danger}15`,
                borderColor: `${theme.danger}40`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color={theme.danger}
            />
            <Text style={[styles.errorText, { color: theme.danger }]}>
              {errorMsg}
            </Text>
            <TouchableOpacity
              onPress={() => setErrorMsg(null)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={theme.danger}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Area */}
        <View style={styles.actionArea}>
          {isConfirmingFill && (
            <View
              style={[
                styles.confirmWrap,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.confirmIconWrap,
                  { backgroundColor: `${theme.primary}15` },
                ]}
              >
                <MaterialCommunityIcons
                  name="gas-station-outline"
                  size={24}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.confirmTitle, { color: theme.text }]}>
                Confirm Fuel Dispense
              </Text>
              <Text style={[styles.confirmDesc, { color: theme.subText }]}>
                Mark{" "}
                <Text style={{ color: theme.text, fontWeight: "700" }}>
                  {transaction.quantity?.toFixed(2)}L {transaction.fuelType}
                </Text>{" "}
                as successfully filled?
              </Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity
                  style={[styles.btnOutline, { borderColor: theme.border }]}
                  onPress={() => setConfirmAction(null)}
                >
                  <Text style={[styles.btnOutlineText, { color: theme.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSolid, { backgroundColor: theme.primary }]}
                  onPress={() => void doMarkFilled()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnSolidText}>Confirm Fill</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isNotFilled && !isConfirmingFill && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={() => setConfirmAction("fill")}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <MaterialCommunityIcons
                name="water-pump"
                size={22}
                color="#fff"
              />
              <Text style={styles.primaryBtnText}>Dispense Fuel</Text>
            </TouchableOpacity>
          )}

          {isFilled && (
            <View
              style={[
                styles.successBanner,
                {
                  backgroundColor: `${theme.success}15`,
                  borderColor: `${theme.success}30`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="check-decagram"
                size={24}
                color={theme.success}
              />
              <Text style={[styles.successText, { color: theme.success }]}>
                Transaction Completed
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              { backgroundColor: theme.surface, borderColor: theme.cardBorder },
            ]}
            onPress={() => router.replace("/(main)/scan")}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={20}
              color={theme.text}
            />
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
              Scan Next QR
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  /* Receipt Card */
  receiptCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 20,
  },
  receiptHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderStyle: "dashed",
  },
  fuelIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroFuelLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 16,
  },
  qtyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  qtyBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },

  receiptBody: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginBottom: 20,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
    opacity: 0.9,
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },

  /* Action Area */
  actionArea: {
    gap: 12,
  },
  confirmWrap: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 8,
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  confirmDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  confirmBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btnOutline: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnOutlineText: {
    fontSize: 15,
    fontWeight: "600",
  },
  btnSolid: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSolidText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 60,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 60,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 4,
  },
  successText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
