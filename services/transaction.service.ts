import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, API_CONFIG } from "../config/api.config";

const TOKEN_KEY = "attendance_auth_token";

const api = axios.create({
  baseURL: API_URL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface FuelTransaction {
  id: string;
  transactionNo: string;
  stationId?: string;
  fuelType: string;
  quantity: number;
  pricePerLiter: number;
  totalAmount: number;
  status: string;
  fuelFilledStatus: "NOT_FILLED" | "FILLED";
  isVoid?: boolean;
  notes?: string;
  createdAt: string;
  customer?: {
    name: string;
    phone?: string;
  };
  station?: {
    name: string;
    location: string;
  };
  attendant?: {
    name: string;
  };
  paymentReceipts?: {
    receiptNo: string;
    qrCode?: string;
    qrVerificationToken?: string;
    qrExpiresAt?: string;
    isVoid?: boolean;
  }[];
}

export const transactionService = {
  async getTransaction(id: string): Promise<FuelTransaction> {
    const response = await api.get<FuelTransaction>(`/fuel-transaction/${id}`);
    return response.data;
  },

  async verifyQrToken(token: string): Promise<FuelTransaction> {
    const response = await api.post<FuelTransaction>(
      "/fuel-transaction/verify-qr",
      {
        token,
      },
    );
    return response.data;
  },

  async markFilled(
    transactionId: string,
    staffProfileId: string,
    qrToken?: string,
  ): Promise<FuelTransaction> {
    const response = await api.patch<FuelTransaction>(
      `/fuel-transaction/${transactionId}/fill-status`,
      {
        filledBy: staffProfileId,
        filledAt: new Date().toISOString(),
        qrVerificationToken: qrToken,
      },
    );
    return response.data;
  },
};
