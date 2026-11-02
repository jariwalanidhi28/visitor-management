import { NativeModules, Platform } from "react-native";

export const getApiBaseUrl = (): string => {
  // 1. Use Expo public env variable if set
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Default to Live Production Server
  return "https://visitor-management-hrt8.onrender.com/api";
};
