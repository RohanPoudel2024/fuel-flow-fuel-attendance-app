import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Vibration,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { authService, type StationUser } from "../../services/auth.service";
import { transactionService } from "../../services/transaction.service";
import { useTheme } from "../../context/theme-context";

export default function ScanScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [user, setUser] = useState<StationUser | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadUser = async () => {
      const u = await authService.getUser();
      if (!u) {
        router.replace("/(auth)/login");
        return;
      }
      setUser(u);
    };
    void loadUser();
  }, [router]);

  // Animate the scan line
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const handleBarCodeScanned = async ({
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    Vibration.vibrate(100);

    let transactionNo: string;
    try {
      const qrPayload = JSON.parse(data.trim()) as { transactionNo?: string };
      transactionNo = qrPayload.transactionNo ?? "";
    } catch {
      transactionNo = data.trim();
    }

    if (!transactionNo) {
      setScanError("This QR code does not contain a valid transaction.");
      setScanned(false);
      return;
    }

    try {
      setIsProcessing(true);
      const transaction =
        await transactionService.getTransaction(transactionNo);

      router.push({
        pathname: "/(main)/transaction-detail",
        params: {
          transaction: JSON.stringify(transaction),
          staffId: user?.staffProfileId ?? "",
        },
      });
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = axiosError.response?.status;
      const message =
        status === 404
          ? "Transaction not found. Please check the QR code."
          : axiosError.response?.data?.message ||
            "Failed to fetch transaction. Please try again.";

      setScanError(message);
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <Text style={[styles.permText, { color: theme.subText }]}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="camera-off" size={64} color={theme.subText} />
          <Text style={[styles.permTitle, { color: theme.text }]}>Camera Permission Required</Text>
          <Text style={[styles.permText, { color: theme.subText }]}>
            This app needs camera access to scan fuel receipt QR codes.
          </Text>
          <TouchableOpacity style={[styles.permBtn, { backgroundColor: theme.primary }]} onPress={requestPermission}>
             <Text style={styles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <SafeAreaView style={[styles.topBar, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          <View style={styles.topBarInner}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/(main)/profile")}
            >
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={26}
                color="#fff"
              />
            </TouchableOpacity>

            <View style={styles.topTitleWrap}>
              <Text style={styles.topTitle}>Scan QR</Text>
              {user?.station && (
                <Text style={styles.topSubtitle} numberOfLines={1}>
                  {user.station.name}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.iconBtn, torchOn && { backgroundColor: `${theme.primary}40` }]}
              onPress={() => setTorchOn(!torchOn)}
            >
              <MaterialCommunityIcons
                name={torchOn ? "flashlight" : "flashlight-off"}
                size={22}
                color={torchOn ? theme.primary : "#fff"}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Scan frame */}
        <View style={[styles.frameWrap, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={styles.frame}>
            {/* Corners */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: theme.primary }]} />

            {/* Animated scan line */}
            {!isProcessing && (
              <Animated.View
                style={[
                  styles.scanLine,
                  { backgroundColor: theme.primary, transform: [{ translateY: scanLineTranslate }] },
                ]}
              />
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={40}
                  color={theme.primary}
                />
                <Text style={[styles.processingText, { color: theme.primary }]}>Fetching transaction…</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom hint */}
        <View style={[styles.bottomBar, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          {scanError ? (
            <View style={[styles.errorBanner, { backgroundColor: `${theme.danger}20`, borderColor: `${theme.danger}50` }]}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={16}
                color={theme.danger}
              />
              <Text style={[styles.errorText, { color: theme.danger }]} numberOfLines={2}>
                {scanError}
              </Text>
              <TouchableOpacity onPress={() => setScanError(null)}>
                <MaterialCommunityIcons
                  name="close"
                  size={14}
                  color={theme.danger}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.hint}>
              Point camera at the fuel receipt QR code
            </Text>
          )}

          {scanned && !isProcessing && (
            <TouchableOpacity
              style={[styles.rescanBtn, { backgroundColor: theme.primary }]}
              onPress={() => setScanned(false)}
            >
              <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
              <Text style={styles.rescanText}>Scan Again</Text>
            </TouchableOpacity>
          )}

          {/* Staff info pill */}
          {user && (
            <View style={[styles.staffPill, { backgroundColor: `${theme.success}20`, borderColor: `${theme.success}50` }]}>
              <MaterialCommunityIcons
                name="account-check"
                size={14}
                color={theme.success}
              />
              <Text style={[styles.staffPillText, { color: theme.success }]} numberOfLines={1}>
                {user.name} · {user.userType === "STATION_ADMIN" ? "Admin" : "Staff"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 260;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },

  /* overlay */
  overlay: { flex: 1, backgroundColor: "transparent", justifyContent: "space-between" },

  /* top bar */
  topBar: { },
  topBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitleWrap: { alignItems: "center" },
  topTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  topSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    maxWidth: 160,
    textAlign: "center",
  },

  /* frame */
  frameWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  /* corners */
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderWidth: 4,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },

  /* scan line */
  scanLine: {
    width: FRAME_SIZE - 20,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },

  /* processing overlay */
  processingOverlay: {
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
    borderRadius: 16,
  },
  processingText: { fontSize: 13, fontWeight: "600" },

  /* bottom bar */
  bottomBar: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  hint: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", fontWeight: "500" },

  rescanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  rescanText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  staffPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  staffPillText: { fontSize: 12, fontWeight: "600" },

  /* error banner */
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    width: "100%",
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "500" },

  /* permission */
  permTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  permText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  permBtn: {
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  permBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
