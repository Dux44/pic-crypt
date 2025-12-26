// context/AuthContext.tsx
import { router } from "expo-router";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
	getUserIdFromToken,
	loadDataFromLib,
	removeTokenFromLib,
	setTokenFromLib,
	updateColorThemeFromLib,
} from "./lib";

type AuthContextType = {
	setToken: (token: string) => Promise<void>;
	removeToken: () => Promise<void>;
	userId: number | null;
	colorTheme: string | null;
	updateColorTheme: (newColor: string | null) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
	setToken: async () => {},
	removeToken: async () => {},
	userId: null,
	colorTheme: "light",
	updateColorTheme: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [colorTheme, setColorTheme] = useState<string | null>("light");
	const [userId, setUserId] = useState<number | null>(null);

	useEffect(() => {
		const load = async () => {
			const [storedToken, storedTheme] = await loadDataFromLib();

			if (storedTheme) setColorTheme(storedTheme);
			if (storedToken) {
				const id = getUserIdFromToken(storedToken);
				setUserId(id);
			} else {
				router.replace("/auth/login");
			}
		};
		load();
	}, []);

	const setToken = async (newToken: string) => {
		await setTokenFromLib(newToken);
		const id = getUserIdFromToken(newToken);
		setUserId(id);
		console.log(id);
		console.log(newToken);
	};

	const removeToken = async () => {
		router.replace(`/auth/login`);
		await removeTokenFromLib();
		setUserId(null);
	};

	const updateColorTheme = async (newColor: string | null) => {
		if (newColor !== "light" && newColor !== "dark") return;
		await updateColorThemeFromLib(newColor);
		setColorTheme(newColor);
	};

	return (
		<AuthContext.Provider value={{ setToken, removeToken, userId, colorTheme, updateColorTheme }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
