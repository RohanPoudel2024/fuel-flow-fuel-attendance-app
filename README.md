# Fuel Flow – Fuel Attendance App

The Fuel Flow Attendance App is a React Native (Expo) mobile application designed for Station Staff (Fuel Boys and Counter Boys) working at registered Fuel Flow partner stations. It allows attendants to log into their assigned shifts, generate dynamic QR codes for customer fuel purchases, and mark transaction completion after fuel is physically dispensed.

---

# Project Objective

The objective of this application is to equip on-ground station employees with a lightweight, fast, and simple mobile interface optimized for operational workflows. Attendants log into the system, view their active shift details, generate unique per-transaction QR codes for customers to scan, and confirm physical fuel dispensal — bridging the digital wallet transaction with the real-world pump delivery.

---

# Features

- Staff login with JWT token-based authentication
- View active shift assignment and duty schedule
- Generate dynamic QR codes for customer fuel transactions
- Confirm fuel has been physically dispensed (mark as filled)
- View today's completed and pending transaction list
- Station-specific session scoping (staff can only view their station)
- Secure logout and session management

---

# Technologies Used

### Framework & Language
- React Native (Expo SDK 54)
- TypeScript
- Expo Router (File-based routing)

### UI & Navigation
- React Navigation (Bottom Tabs, Stack Navigator)
- Expo Vector Icons
- React Native Reanimated (Animations)
- React Native Gesture Handler

### QR Code
- react-native-qrcode-svg (Dynamic QR generation)
- react-native-svg (SVG rendering support)

### Data & Networking
- Axios (API HTTP requests)
- AsyncStorage (Local token persistence)

### Device Features
- Expo Camera (QR scanning if needed)
- Expo Image Picker (Profile photo)
- Expo Web Browser (External links)

---

# System Requirements

### Hardware
- Android smartphone (Android 8.0+) or iOS device (iOS 13+)
- Active internet connection (Wi-Fi or Mobile Data)

### Software
- Node.js v18 or higher
- Expo CLI
- Android Studio (for Android emulator) or Xcode (for iOS simulator)

---

# Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/fuel-flow-fuel-attendance.git
   ```

2. **Navigate to the project folder:**
   ```bash
   cd fuel-flow-fuel-attendance
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   # Create a .env file and add:
   # API_BASE_URL=http://your-api-server:3000
   ```

5. **Start the development server:**
   ```bash
   npx expo start
   ```

6. **Run on device/emulator:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR with the Expo Go app on a real device

---

# Project Structure

```text
fuel-flow-fuel-attendance/
├── app/                    # Expo Router screen files
│   ├── (auth)/             # Staff Login screen
│   └── (tabs)/             # Home (shift info), QR Generator, Transactions
├── components/             # Reusable UI components (QR display, transaction cards)
├── services/               # API service functions (auth, transactions)
├── hooks/                  # Custom React hooks
├── constants/              # API base URLs, theme colors
├── context/                # Auth context (token/user state)
├── assets/                 # Fonts and static images
├── app.json                # Expo app configuration
└── package.json
```

---

# Screenshots

- Staff Login screen
- Active Shift details screen
- QR Code generation screen (showing the dynamic QR for a customer)
- Today's Transaction list screen

---

# Future Improvements

- Offline mode with queued QR validation on reconnect
- Biometric login (fingerprint/face) for faster attendance
- Shift performance statistics for individual attendants
- Direct in-app messaging with Station Admin

---

# Authors

- **Student Name:** Rohan Poudel
- **Project:** Final Year Project — Fuel Flow System
- **Program:** Computer Science / Information Technology

---

# License

This project is created for educational purposes as part of a Final Year Project.
