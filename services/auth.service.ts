import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, API_CONFIG } from "../config/api.config";

const TOKEN_KEY = "attendance_auth_token";
const USER_KEY = "attendance_user_data";

const api = axios.create({
  baseURL: API_URL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

api.interceptors.request.use(
  async (config) => {
    console.log(
      `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    );
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response Success: ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.message === "Network Error") {
      console.error("[API] Network Error - Cannot reach server at:", API_URL);
    } else if (error.response) {
      console.error(
        `[API] Response Error: ${error.response.status}`,
        error.response.data,
      );
    }
    return Promise.reject(error);
  },
);

export interface StationUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  userType: "STATION_ADMIN" | "STATION_STAFF";
  avatarUrl?: string;
  staffRole?: string;
  station: {
    id: string;
    name: string;
    location: string;
    profileImageUrl?: string;
  } | null;
  staffProfileId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: StationUser;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/station/login", {
      email,
      password,
    });
    const data = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  },

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async getUser(): Promise<StationUser | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StationUser;
    } catch {
      return null;
    }
  },

  async isLoggedIn(): Promise<boolean> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },

  async getStation(
    stationId: string,
  ): Promise<{ profileImageUrl?: string; name?: string } | null> {
    try {
      const response = await api.get<{
        profileImageUrl?: string;
        name?: string;
      }>(`/station/${stationId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  async fetchCurrentUser(): Promise<StationUser | null> {
    const cached = await authService.getUser();
    const response = await api.get<Record<string, unknown>>("/auth/me");
    const data = response.data;
    const updated: StationUser = {
      id: data.id as string,
      email: data.email as string,
      name: data.name as string,
      phone: data.phone as string | undefined,
      userType: data.userType as "STATION_ADMIN" | "STATION_STAFF",
      avatarUrl: data.avatarUrl as string | undefined,
      staffRole: data.staffRole as string | undefined,
      station: (data.station as StationUser["station"]) ?? null,
      staffProfileId: cached?.staffProfileId ?? null,
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  },

  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    await api.post("/auth/change-password", { oldPassword, newPassword });
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/forgot-password", { email });
  },

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    await api.post("/auth/reset-password", { email, otp, newPassword });
  },

  async uploadAvatar(imageUri: string, mimeType: string): Promise<string> {
    const token = await authService.getToken();
    const form = new FormData();
    form.append("file", {
      uri: imageUri,
      type: mimeType,
      name: "avatar.jpg",
    } as unknown as Blob);
    const res = await fetch(`${API_URL}/upload/profile-image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const errData = (await res.json()) as { message?: string };
      throw new Error(errData.message ?? `Upload failed (${res.status})`);
    }
    const data = (await res.json()) as { avatarUrl: string };
    const url = data.avatarUrl;
    const current = await authService.getUser();
    if (current) {
      await AsyncStorage.setItem(
        USER_KEY,
        JSON.stringify({ ...current, avatarUrl: url }),
      );
    }
    return url;
  },
};
