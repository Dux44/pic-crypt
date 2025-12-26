import ExitIcon from "@/assets/images/exit.svg";
import { ThemedTextInput } from "@/components/ThemedInput";
import { ThemedSvg } from "@/components/ThemedSvg";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { selectUser } from "@/redux/selectors";
import { updateUser as updateUserAction } from "@/redux/usersSlice";
import { useAuth } from "@/utils/AuthContext";
import { buildAbsoluteUrl } from "@/utils/lib";
import { realtimeManager } from "@/utils/RealtimeManager";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";

export default function ProfileScreen() {
	const dispatch = useDispatch();
	const { userId, removeToken } = useAuth();
	const user = useSelector((state) => (userId ? selectUser(state, userId) : undefined));
	const [image, setImage] = useState<string | null>(null);
	const [username, setUsername] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [bio, setBio] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [passwordConfirm, setPasswordConfirm] = useState<string>("");
	const avatarSource = buildAbsoluteUrl(image ?? user?.avatarUrl);

	useEffect(() => {
		if (user) {
			setUsername(user.username || "");
			setEmail(user.email || "");
			setBio(user.bio || "");
		}
	}, [user]);

	async function pickImage() {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
		});

		if (!result.canceled) {
			setImage(result.assets[0].uri);
		}
	}

	const handleExit = () => {
		removeToken();
	};

	const handleFieldSubmit = async (fieldName: keyof typeof user, value: string | null) => {
		if (!user) return;

		try {
			const updatedData = { [fieldName]: value };
			const updatedUser = await realtimeManager.emit("user", "update", { ...user, ...updatedData });
			if (updatedUser) {
				dispatch(updateUserAction(updatedUser));
			}
			Alert.alert(`${fieldName} успішно оновлено.`);
		} catch (error) {
			Alert.alert(`Не вдалося оновити поле ${fieldName}: ${(error as any)?.message || error}`);
		}
	};

	const handleAvatarUpdate = async () => {
		if (!image) {
			Alert.alert("Оберіть зображення для аватару");
			return;
		}

		try {
			const updatedUser = await realtimeManager.emit("user", "update-avatar", { avatar: image });
			if (updatedUser) {
				dispatch(updateUserAction(updatedUser));
				setImage(null);
			}
			Alert.alert("Аватар успішно оновлено.");
		} catch (error) {
			Alert.alert(`Не вдалося оновити аватар: ${(error as any)?.message || error}`);
		}
	};

	const handleDeleteAccount = async () => {
		alert("Видалити аккаунт (поки заглушка)");
	};

	if (!userId || !user) {
		return (
			<ThemedView style={styles.container}>
				<ThemedText>Завантаження профілю...</ThemedText>
			</ThemedView>
		);
	}

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
		>
			<ThemedView style={styles.header}>
				<ThemedView style={{ width: 35 }} />
				<ThemedText style={styles.headerText}>Профіль</ThemedText>
				<Pressable style={styles.exitButton} onPress={handleExit}>
					<ThemedSvg IconComponent={ExitIcon} width={35} height={35} fill="#007AFF" />
				</Pressable>
			</ThemedView>

			<ScrollView contentContainerStyle={styles.scrollContainer}>
				<ThemeSwitcher />
				<ThemedView style={styles.card}>
					<Pressable onPress={pickImage}>
						{avatarSource ? (
							<Image style={styles.avatar} source={{ uri: avatarSource }} />
						) : (
							<ThemedView style={[styles.avatar, styles.avatarPlaceholder]}>
								<ThemedText style={styles.avatarPlaceholderText}>Без аватару</ThemedText>
							</ThemedView>
						)}
					</Pressable>
					<Pressable onPress={handleAvatarUpdate} style={styles.saveButton}>
						<ThemedText style={styles.saveButtonText}>Оновити аватар</ThemedText>
					</Pressable>
				</ThemedView>

				<ThemedView style={styles.card}>
					<ThemedText style={styles.label}>Ім&apos;я користувача</ThemedText>
					<ThemedTextInput value={username} onChangeText={setUsername} style={styles.input} />
					<Pressable onPress={() => handleFieldSubmit("username", username)} style={styles.saveButton}>
						<ThemedText style={styles.saveButtonText}>Оновити ім&apos;я</ThemedText>
					</Pressable>
				</ThemedView>

				<ThemedView style={styles.card}>
					<ThemedText style={styles.label}>Про себе</ThemedText>
					<ThemedTextInput value={bio} onChangeText={setBio} style={styles.input} />
					<Pressable onPress={() => handleFieldSubmit("bio", bio)} style={styles.saveButton}>
						<ThemedText style={styles.saveButtonText}>Оновити опис профілю</ThemedText>
					</Pressable>
				</ThemedView>

				<ThemedView style={styles.card}>
					<ThemedText style={styles.label}>Електронна адреса</ThemedText>
					<ThemedTextInput value={email} onChangeText={setEmail} style={styles.input} />
					<Pressable onPress={() => handleFieldSubmit("email", email)} style={styles.saveButton}>
						<ThemedText style={styles.saveButtonText}>Оновити адресу</ThemedText>
					</Pressable>
				</ThemedView>

				<ThemedView style={styles.card}>
					<ThemedText style={styles.label}>Пароль</ThemedText>
					<ThemedTextInput secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
					<ThemedText style={styles.label}>Повтор паролю</ThemedText>
					<ThemedTextInput
						secureTextEntry
						value={passwordConfirm}
						onChangeText={setPasswordConfirm}
						style={styles.input}
					/>
					<Pressable onPress={() => handleFieldSubmit("password", password)} style={styles.saveButton}>
						<ThemedText style={styles.saveButtonText}>Оновити пароль</ThemedText>
					</Pressable>
				</ThemedView>

				<Pressable onPress={handleDeleteAccount} style={styles.removeButton}>
					<ThemedText style={styles.removeButtonText}>Видалити аккаунт</ThemedText>
				</Pressable>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		gap: 20,
	},
	scrollContainer: { padding: 20, gap: 16 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderColor: "#ccc",
		paddingHorizontal: 10,
	},
	headerText: {
		fontWeight: "bold",
		fontSize: 22,
		textAlign: "center",
		flex: 1,
	},
	exitButton: { alignSelf: "flex-end" },
	avatar: {
		width: 150,
		height: 150,
		borderRadius: 100,
		alignSelf: "center",
		marginVertical: 20,
	},
	avatarPlaceholder: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#f2f4f7",
	},
	avatarPlaceholderText: {
		fontWeight: "600",
		color: "#666",
	},
	card: {
		gap: 12,
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#e1e4ea",
	},

	input: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 12,
		fontSize: 16,
	},
	label: {
		fontWeight: "600",
		fontSize: 14,
	},

	saveButton: {
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: "center",
		backgroundColor: "#3399ff",
		marginTop: 10,
	},
	saveButtonText: {
		color: "#fff",
		fontWeight: "700",
	},

	removeButton: {
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: "center",
		backgroundColor: "#ff3b30",
		marginTop: 30,
	},
	removeButtonText: {
		color: "#fff",
		fontWeight: "700",
	},
});
