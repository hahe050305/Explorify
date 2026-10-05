// src/config/api.ts
import { Platform } from 'react-native';

/**
 * Configuration for connecting Explorify React Native app to the backend server.
 * 
 * 1. Android Emulator:
 *    Android emulator maps host machine's 127.0.0.1 to 10.0.2.2.
 * 
 * 2. iOS Simulator:
 *    reaches host machine via localhost:5000.
 * 
 * 3. Physical Device (Android or iPhone on same Wi-Fi):
 *    Replace DEV_MACHINE_IP with your computer's local Wi-Fi IP (e.g. '192.168.1.15').
 */

// If testing on a physical phone over Wi-Fi, set your computer's local IP here:
export const DEV_MACHINE_IP: string | null = null; // e.g. '192.168.1.100'

export const getApiBaseUrl = (): string => {
  if (DEV_MACHINE_IP) {
    // Physical phone over Wi-Fi: use PC's local network IP
    return `http://${DEV_MACHINE_IP}:5000/api`;
  }

  // For both Android Emulator AND physical phone via USB (adb reverse tcp:5000 tcp:5000):
  // "localhost" on the phone resolves to the PC via the adb reverse tunnel.
  // Note: 10.0.2.2 only works inside the Android Emulator's virtual network —
  // a real physical phone cannot resolve 10.0.2.2 at all.
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  SIGN_UP: `${API_BASE_URL}/auth/signup`,
  SIGN_IN: `${API_BASE_URL}/auth/signin`,
  USERS: `${API_BASE_URL}/auth/users`,
  PAYMENT_CONFIG: `${API_BASE_URL}/payment/config`,
  CREATE_ORDER: `${API_BASE_URL}/payment/create-order`,
  VERIFY_PAYMENT: `${API_BASE_URL}/payment/verify-payment`,
};
