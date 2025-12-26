import { login } from "@/api/auth";
import { getUser } from "@/api/users";
import { ThemedTextInput } from "@/components/ThemedInput";
import { ThemedText } from "@/components/ThemedText";
import { addUser } from "@/redux/usersSlice";
import { useAuth } from "@/utils/AuthContext";
import { getUserIdFromToken } from "@/utils/lib";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from "react-native";
import { useDispatch } from "react-redux";

export default function LoginScreen() {
	const router = useRouter();
	const dispatch = useDispatch();
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const { setToken } = useAuth();

	const handleLogin = async () => {
		if (!username || !password) {
			Alert.alert("Помилка", "Заповніть усі поля");
			return;
		}
		try {
			const data = await login({ username, password });
			setToken(data.token);

			const response = await getUser();
			dispatch(addUser(response));

			Alert.alert("Успіх", `Вітаємо, ${username}!`);
			router.replace("/chats");
		} catch (error) {
			Alert.alert("Помилка", "Невірні дані або сервер недоступний");
		}
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
		>
			<Image style={styles.logo} source={require("@/assets/images/logo.png")} />

			<ThemedText style={styles.header}>Авторизація</ThemedText>
			<ThemedTextInput placeholder="Логін" value={username} onChangeText={setUsername} style={styles.input} />

			<ThemedTextInput
				placeholder="Пароль"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
				style={styles.input}
			/>

			<Pressable onPress={handleLogin} style={styles.button}>
				<ThemedText>Увійти</ThemedText>
			</Pressable>

			<Pressable onPress={() => router.push("/auth/register")} style={styles.button}>
				<ThemedText>Перейти до реєстрації</ThemedText>
			</Pressable>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		gap: 12,
		bottom: 100,
	},
	logo: {
		width: 200,
		height: 200,
	},
	header: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
	input: {
		width: "70%",
		borderWidth: 1,
		padding: 10,
		borderRadius: 12,
		fontSize: 16,
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	button: {
		width: "70%",
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: "center",
		backgroundColor: "#3399ff",
		marginTop: 10,
	},
});
