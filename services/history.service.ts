import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FuelTransaction } from "./transaction.service";

const HISTORY_KEY = "attendance_action_history";

export interface HistoryEntry {
  transactionNo: string;
  transactionId: string;
  action: "FILLED";
  fuelType: string;
  quantity: number;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  stationName?: string;
  pricePerLiter?: number;
  staffProfileId?: string | null;
  paymentStatus?: string;
  notes?: string;
  filledAt: string;
  timestamp: string;
  transaction?: FuelTransaction;
}

export const historyService = {
  async getAll(): Promise<HistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as HistoryEntry[];
    } catch {
      return [];
    }
  },

  async addEntry(entry: HistoryEntry): Promise<void> {
    const existing = await historyService.getAll();
    const updated = [entry, ...existing].slice(0, 100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(HISTORY_KEY);
  },
};
