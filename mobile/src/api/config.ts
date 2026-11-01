import { NativeModules, Platform } from "react-native";

export const getApiBaseUrl = (): string => {
  // 1. Try extracting host IP dynamically from Metro packager in development
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/https?:\/\/([^/:]+)/);
    if (match && match[1] && match[1] !== "localhost" && match[1] !== "127.0.0.1") {
      return `http://${match[1]}:5000/api`;
    }
  }

  // 2. Use Expo public env variable if set
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 3. Android Emulator fallback
  if (Platform.OS === "android" && !scriptURL) {
    return "http://10.0.2.2:5000/api";
  }

  // 4. Default to current network IP
  return "http://10.79.110.138:5000/api";
};
