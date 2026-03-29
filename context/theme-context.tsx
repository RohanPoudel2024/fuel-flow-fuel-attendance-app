import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme, Appearance } from "react-native";

interface ThemeColors {
  bg: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  subText: string;
  border: string;
  cardBorder: string;
  danger: string;
  success: string;
  warning: string;
  info: string;
  inputBg: string;
  headerBg: string;
  headerBorder: string;
}

const lightTheme: ThemeColors = {
  bg: "#F8FAFC", // Sleek modern light gray
  surface: "#FFFFFF",
  primary: "#14B8A6", // Teal - highly visible for attendants
  secondary: "#0F172A",
  accent: "#F59E0B",
  text: "#0F172A",
  subText: "#64748B",
  border: "#E2E8F0",
  cardBorder: "#F1F5F9",
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",
  inputBg: "#F1F5F9",
  headerBg: "#FFFFFF",
  headerBorder: "#E2E8F0",
};

const darkTheme: ThemeColors = {
  bg: "#0B1120", // Deep navy blue
  surface: "#1E293B",
  primary: "#14B8A6",
  secondary: "#F8FAFC",
  accent: "#F59E0B",
  text: "#F8FAFC",
  subText: "#94A3B8",
  border: "#334155",
  cardBorder: "#1E293B",
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",
  inputBg: "#0F172A",
  headerBg: "rgba(11, 17, 32, 0.8)",
  headerBorder: "#1E293B",
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
