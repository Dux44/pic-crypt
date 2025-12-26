import { API_URL } from "@/config";
import { router } from "expo-router";
import { Alert, Platform } from "react-native";

let SecureStore: typeof import("expo-secure-store") | null = null;
if (Platform.OS !== "web") {
	SecureStore = require("expo-secure-store");
}

export async function loadDataFromLib(): Promise<[string | null, string | null]> {
	let token: string | null = null;
	let theme: string | null = null;

	if (Platform.OS === "web") {
		token = localStorage.getItem("token");
		theme = localStorage.getItem("colorTheme");
	} else if (SecureStore) {
		token = await SecureStore.getItemAsync("token");
		theme = await SecureStore.getItemAsync("colorTheme");
	}

	return [token, theme];
}

export async function updateColorThemeFromLib(newColor: string | null) {
	if (newColor !== "light" && newColor !== "dark") return;

	if (Platform.OS === "web") {
		localStorage.setItem("colorTheme", newColor);
	} else if (SecureStore) {
		await SecureStore.setItemAsync("colorTheme", newColor);
	}
}

export async function getTokenFromLib() {
	if (Platform.OS === "web") {
		return localStorage.getItem("token");
	} else {
		return await SecureStore.getItemAsync("token");
	}
}

export async function setTokenFromLib(token: string | null) {
	if (token) {
		if (Platform.OS === "web") {
			localStorage.setItem("token", token);
		} else {
			await SecureStore.setItemAsync("token", token);
		}
	}
}

export async function removeTokenFromLib() {
	if (Platform.OS === "web") {
		localStorage.removeItem("token");
		router.replace("/auth/login");
	} else {
		await SecureStore.deleteItemAsync("token");
	}
	Alert.alert(
		"Час сесії сплинув",
		"Будь ласка, повторіть вхід",
		[
			{
				text: "OK",
				onPress: () => router.push("/auth/login"),
			},
		],
		{ cancelable: false }
	);
}

export const buildAbsoluteUrl = (path?: string | null): string | undefined => {
	if (!path) return undefined;
	if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;

	const base = API_URL?.replace(/\/$/, "");
	if (!base) return path;

	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${base}${normalizedPath}`;
};

export const getUserIdFromToken = (token: string): number | null => {
	try {
		const payloadPart = token.split(".")[1];
		if (!payloadPart) return null;

		const decodedJson = atob(payloadPart);
		const payload = JSON.parse(decodedJson);

		return typeof payload.id === "number" ? payload.id : null;
	} catch {
		return null;
	}
};
