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

  async getStation(stationId: string): Promise<{ profileImageUrl?: string; name?: string } | null> {
    try {
      const response = await api.get<{ profileImageUrl?: string; name?: string }>(`/station/${stationId}`);
      return response.data;
    } catch {
      return null;
    }
  },
};
