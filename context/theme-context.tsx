import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme, Appearance } from "react-native";

interface ThemeColors {
  bg: string;
  surface: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  text: string;
  subText: string;
  icon: string;
  border: string;
  cardBorder: string;
  divider: string;
  placeholder: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  info: string;
  inputBg: string;
  headerBg: string;
  headerBorder: string;
  cardBg: string;
}

const lightTheme: ThemeColors = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  primary: "#FB923C",
  primaryLight: "rgba(251,146,60,0.1)",
  secondary: "#0F172A",
  accent: "#F59E0B",
  text: "#0F172A",
  subText: "#64748B",
  icon: "#64748B",
  border: "#E2E8F0",
  cardBorder: "#F1F5F9",
  divider: "#E2E8F0",
  placeholder: "#94A3B8",
  danger: "#EF4444",
  dangerLight: "rgba(239,68,68,0.15)",
  success: "#10B981",
  successLight: "rgba(16,185,129,0.15)",
  warning: "#F59E0B",
  warningLight: "rgba(245,158,11,0.15)",
  info: "#3B82F6",
  inputBg: "#F1F5F9",
  headerBg: "#FFFFFF",
  headerBorder: "#E2E8F0",
  cardBg: "#FFFFFF",
};

const darkTheme: ThemeColors = {
  bg: "#0F172A",
  surface: "#1E293B",
  primary: "#FB923C",
  primaryLight: "rgba(251,146,60,0.12)",
  secondary: "#F8FAFC",
  accent: "#F59E0B",
  text: "#F1F5F9",
  subText: "#94A3B8",
  icon: "#64748B",
  border: "#334155",
  cardBorder: "#1E293B",
  divider: "#334155",
  placeholder: "#475569",
  danger: "#EF4444",
  dangerLight: "rgba(239,68,68,0.15)",
  success: "#10B981",
  successLight: "rgba(16,185,129,0.15)",
  warning: "#F59E0B",
  warningLight: "rgba(245,158,11,0.15)",
  info: "#3B82F6",
  inputBg: "#0F172A",
  headerBg: "rgba(15,23,42,0.92)",
  headerBorder: "#1E293B",
  cardBg: "#1E293B",
};

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemColorScheme === "dark");

  useEffect(() => {
    // Optionally automatically sync with system setting
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === "dark");
    });
    return () => listener.remove();
  }, []);

  const toggleTheme = () => setIsDark(!isDark);
  const setTheme = (dark: boolean) => setIsDark(dark);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Dummy export to satisfy expo-router rules if placed inside the app folder
export default function ThemeContextRoute() {
  return null;
}
