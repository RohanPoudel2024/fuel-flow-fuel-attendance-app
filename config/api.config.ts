import { Platform } from "react-native";

const USE_NGROK = true;
const NGROK_URL = "faye-subobsolete-uninferrably.ngrok-free.dev";
const LOCAL_IP = "192.168.18.244";

const getApiUrl = () => {
  if (USE_NGROK && NGROK_URL) {
    return `https://${NGROK_URL}/api`;
  }
  if (true) {
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
