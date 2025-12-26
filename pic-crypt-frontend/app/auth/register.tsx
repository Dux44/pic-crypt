import { register } from "@/api/auth";
import { getUser } from "@/api/users";
import { ThemedTextInput } from "@/components/ThemedInput";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { addUser } from "@/redux/usersSlice";
import { useAuth } from "@/utils/AuthContext";
import { getUserIdFromToken } from "@/utils/lib";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from "react-native";
import { useDispatch } from "react-redux";

export default function RegisterScreen() {
	const router = useRouter();
	const dispatch = useDispatch();
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const { setToken } = useAuth();

	const handleRegister = async () => {
		if (!username || !email || !password || !confirm) {
			Alert.alert("Помилка", "Заповніть усі поля");
			return;
		}
		if (password !== confirm) {
			Alert.alert("Помилка", "Паролі не співпадають");
			return;
		}

		try {
			const data = await register({ username, email, password });
			setToken(data.token);
			console.log(data.token);

			const userId = getUserIdFromToken(data.token);
			const response = await getUser();

			dispatch(addUser(response));
			console.log(userId);

			Alert.alert("Успіх", `Користувач ${username} зареєстрований!`);
			router.replace("/chats");
		} catch (error) {
			Alert.alert("Помилка", "Невірні дані або сервер недоступний");
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
		>
			<ThemedView style={styles.container}>
				<Image style={styles.logo} source={require("@/assets/images/logo.png")} />
				<ThemedText style={styles.header}>Реєстрація</ThemedText>

				<ThemedTextInput placeholder="Новий логін" value={username} onChangeText={setUsername} style={styles.input} />

				<ThemedTextInput
					placeholder="Пошта"
					value={email}
					onChangeText={setEmail}
					keyboardType="email-address"
					style={styles.input}
				/>

				<ThemedTextInput
					placeholder="Пароль"
					secureTextEntry
					value={password}
					onChangeText={setPassword}
					style={styles.input}
				/>

				<ThemedTextInput
					placeholder="Повтор пароля"
					secureTextEntry
					value={confirm}
					onChangeText={setConfirm}
					style={styles.input}
				/>

				<Pressable onPress={handleRegister} style={styles.button}>
					<ThemedText>Зареєструватися</ThemedText>
				</Pressable>

				<Pressable onPress={() => router.push("/auth/login")} style={styles.button}>
					<ThemedText>У мене вже є акаунт</ThemedText>
				</Pressable>
			</ThemedView>
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
		borderRadius: 12,
		padding: 10,
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
function dispatch(arg0: any) {
	throw new Error("Function not implemented.");
}
