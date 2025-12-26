// config.ts
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

const { API_URL, API_KEY, SOCKET_URL } = extra as Record<string, string | undefined>;

export { API_KEY, API_URL, SOCKET_URL };
