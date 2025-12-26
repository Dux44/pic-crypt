import { ThemedView } from "@/components/ThemedView";
import { upsertChats } from "@/redux/chatsSlice";
import { upsertFriends } from "@/redux/friendsSlice";
import { setMessages } from "@/redux/messagesSlice";
import { store } from "@/redux/store";
import { upsertUsers } from "@/redux/usersSlice";
import { AuthProvider, useAuth } from "@/utils/AuthContext";
import { realtimeManager } from "@/utils/RealtimeManager";
import { getChats } from "@/api/chats";
import { getFriends } from "@/api/friends";
import { getMessages } from "@/api/messages";
import { getUsers } from "@/api/users";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Provider, useDispatch } from "react-redux";

export default function RootLayout() {
	return (
		<Provider store={store}>
			<AuthProvider>
				<InnerLayout />
			</AuthProvider>
		</Provider>
	);
}

function InnerLayout() {
	const { colorTheme, userId } = useAuth();
	const dispatch = useDispatch();

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const bootstrap = async () => {
			// If no user, do not block UI
			if (!userId) {
				if (isMounted) setLoading(false);
				return;
			}

			if (isMounted) setLoading(true);

			try {
				const [users, chats, friends] = await Promise.all([getUsers(), getChats(), getFriends()]);

				dispatch(upsertUsers(users));
				dispatch(upsertChats(chats));
				dispatch(upsertFriends(friends));

				const messagesPerChat = await Promise.all(
					chats.map(async (chat) => {
						const msgs = await getMessages(chat.id);
						return {
							chatId: chat.id,
							messages: msgs.map((m: any) => ({
								...m,
								createdAt: new Date(m.createdAt),
							})),
						};
					})
				);

				messagesPerChat.forEach(({ chatId, messages }) => {
					dispatch(setMessages({ chatId, messages }));
				});

				await realtimeManager.init();
			} catch (e) {
				console.warn("Failed to bootstrap app data", e);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		bootstrap();

		return () => {
			isMounted = false;
			realtimeManager.disconnect();
		};
	}, [userId, dispatch]);

	useEffect(() => {
		NavigationBar.setBackgroundColorAsync(colorTheme === "dark" ? "#000000" : "#ffffff");
		NavigationBar.setButtonStyleAsync(colorTheme === "dark" ? "light" : "dark");
	}, [colorTheme]);

	if (loading) {
		return (
			<ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" />
			</ThemedView>
		);
	}

	const theme = colorTheme === "dark" ? DarkTheme : DefaultTheme;

	return (
		<>
			<StatusBar style={colorTheme === "dark" ? "light" : "dark"} backgroundColor="transparent" translucent />
			<ThemeProvider value={theme}>
				<Stack
					screenOptions={{
						headerShown: false,
					}}
				>
					<Stack.Screen name="(tabs)" />
				</Stack>
			</ThemeProvider>
		</>
	);
}

/*

import { ThemedView } from "@/components/themed-view";
import { store } from "@/redux/store";
import { AuthProvider, useAuth } from "@/utils/AuthContext";
import { getTokenFromLib } from "@/utils/lib";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Provider } from "react-redux";

export default function RootLayout() {
	return (
		<AuthProvider>
			<Provider store={store}>
				<WebSocketProvider>
				<InnerLayout />
				 </WebSocketProvider>
			</Provider>
		</AuthProvider>
	);
}

function InnerLayout() {
	const { colorTheme } = useAuth();

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			const token = await getTokenFromLib();
			if (!token) {
				router.replace("/auth/login");
			}
			setLoading(false);
		};
		checkAuth();
	}, []);

	if (loading) {
		return (
			<ThemedView
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: colorTheme === "dark" ? "#000000" : "#ffffff",
				}}
			>
				<ActivityIndicator size="large" color={colorTheme === "dark" ? "#ffffff" : "#000000"} />
			</ThemedView>
		);
	}

	const theme = colorTheme === "dark" ? DarkTheme : DefaultTheme;

	return (
		<>
			<StatusBar style={colorTheme === "dark" ? "light" : "dark"} backgroundColor="transparent" translucent />
			<ThemeProvider value={theme}>
				<Stack
					screenOptions={{
						headerShown: false,
					}}
				>
					<Stack.Screen name="(tabs)" />
				</Stack>
			</ThemeProvider>
		</>
	);
}

*/
