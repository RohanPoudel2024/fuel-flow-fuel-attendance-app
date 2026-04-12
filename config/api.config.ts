import { Platform } from "react-native";

const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const USE_NGROK = process.env.EXPO_PUBLIC_USE_NGROK === "true";
const NGROK_URL = process.env.EXPO_PUBLIC_NGROK_URL ?? "";
const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP ?? "";

const getApiUrl = () => {
  if (PRODUCTION_API_URL) {
    return PRODUCTION_API_URL;
  }

  if (USE_NGROK && NGROK_URL) {
    return `https://${NGROK_URL}/api`;
  }

  if (LOCAL_IP) {
    return `http://${LOCAL_IP}:3000/api`;
  }

  return Platform.select({
    ios: "http://localhost:3000/api",
    android: "http://10.0.2.2:3000/api",
    default: "http://localhost:3000/api",
  }) as string;
};

export const API_URL = getApiUrl();

export const API_CONFIG = {
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
};
