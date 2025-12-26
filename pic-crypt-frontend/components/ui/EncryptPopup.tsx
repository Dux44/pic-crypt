import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ThemedTextInput } from "../ThemedInput";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { ThemedSvg } from "../ThemedSvg";
import AddIcon from "@/assets/images/add-image.svg";
import { encryptGifAndStore, storeImage } from "@/api/steno";

type EncryptPopupProps = {
	onClose: () => void;
	onEncrypted: (encryptedImageUri: string, selfDestructType: SelfDestructType) => void;
};

const MAX_CONTENT_LENGTH = 224;
type SelfDestructType = "NONE" | "ON_READ" | "TIME_BASED";

export default function EncryptPopup({ onClose, onEncrypted }: EncryptPopupProps) {
	const [password, setPassword] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [image, setImage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selfDestructType, setSelfDestructType] = useState<SelfDestructType>("NONE");

	async function pickImage() {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
		});

		if (!result.canceled) {
			setImage(result.assets[0].uri);
			setError(null);
		}
	}

	const handleEncrypt = async () => {
		if (!image) {
			setError("Оберіть зображення");
			return;
		}
		if (!password) {
			setError("Введіть пароль");
			return;
		}
		if (!content) {
			setError("Введіть текст для шифрування");
			return;
		}
		if (content.length > MAX_CONTENT_LENGTH) {
			setError(`Максимальна довжина — ${MAX_CONTENT_LENGTH} символів`);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const url = await encryptGifAndStore({ imageUri: image, password, text: content });

			onEncrypted(url, selfDestructType);
			onClose();
		} catch (err: any) {
			setError(err.response?.data?.message || err.message || "Помилка шифрування");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSendPlain = async () => {
		if (!image) {
			setError("Оберіть зображення");
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const url = await storeImage({ imageUri: image });
			onEncrypted(url, selfDestructType);
			onClose();
		} catch (err: any) {
			setError(err.response?.data?.message || err.message || "Не вдалося надіслати зображення");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ThemedView style={styles.container}>
			<ThemedView style={styles.header}>
				<ThemedText style={styles.title}>Зашифрувати повідомлення</ThemedText>
				<Pressable onPress={onClose} style={styles.closeButton}>
					<ThemedText style={styles.closeText}>✕</ThemedText>
				</Pressable>
			</ThemedView>

			<ThemedText style={styles.label}>Оберіть зображення:</ThemedText>
			<Pressable onPress={pickImage} style={styles.imagePicker}>
				{image ? (
					<Image source={{ uri: image }} style={styles.imagePreview} />
				) : (
					<ThemedView style={styles.imagePlaceholder}>
						<ThemedSvg IconComponent={AddIcon} fill="#007AFF" />
						<ThemedText style={styles.placeholderText}>Натисніть для вибору</ThemedText>
					</ThemedView>
				)}
			</Pressable>

			<ThemedText style={styles.label}>Секретний пароль:</ThemedText>
			<ThemedTextInput placeholder="Введіть пароль" value={password} onChangeText={setPassword} style={styles.input} />

			<ThemedText style={styles.label}>Текст для шифрування:</ThemedText>
			<ThemedTextInput
				placeholder="Введіть секретне повідомлення"
				value={content}
				onChangeText={setContent}
				maxLength={MAX_CONTENT_LENGTH}
				multiline
				numberOfLines={3}
				style={[styles.input, styles.textArea]}
			/>
			<ThemedText style={styles.helper}>
				{content.length}/{MAX_CONTENT_LENGTH}
			</ThemedText>

			<ThemedText style={styles.label}>Самознищення повідомлення:</ThemedText>
			<ThemedView style={styles.toggleRow}>
				{[
					{ key: "NONE" as SelfDestructType, label: "Ніколи" },
					{ key: "ON_READ" as SelfDestructType, label: "Після прочитання" },
					{ key: "TIME_BASED" as SelfDestructType, label: "Через 30 сек" },
				].map(({ key, label }) => {
					const isActive = selfDestructType === key;
					return (
						<Pressable
							key={key}
							onPress={() => setSelfDestructType(key)}
							style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
						>
							<ThemedText style={[styles.toggleLabel, isActive && styles.toggleLabelActive]}>{label}</ThemedText>
						</Pressable>
					);
				})}
			</ThemedView>

			{error && <ThemedText style={styles.error}>{error}</ThemedText>}

			<Pressable
				onPress={handleEncrypt}
				style={[styles.encryptButton, isLoading && styles.disabledButton]}
				disabled={isLoading}
			>
				{isLoading ? (
					<ActivityIndicator color="#fff" />
				) : (
					<ThemedText style={styles.encryptButtonText}>Зашифрувати та відправити</ThemedText>
				)}
			</Pressable>

			<Pressable
				onPress={handleSendPlain}
				style={[styles.plainButton, isLoading && styles.disabledButton]}
				disabled={isLoading}
			>
				{isLoading ? (
					<ActivityIndicator color="#fff" />
				) : (
					<ThemedText style={styles.encryptButtonText}>Відправити без шифрування</ThemedText>
				)}
			</Pressable>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 20,
		borderRadius: 16,
		width: "100%",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
	},
	closeButton: {
		padding: 8,
	},
	closeText: {
		fontSize: 18,
	},
	label: {
		fontSize: 14,
		marginBottom: 8,
		marginTop: 12,
	},
	imagePicker: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 12,
		overflow: "hidden",
		marginBottom: 8,
	},
	imagePreview: {
		width: "100%",
		height: 150,
		resizeMode: "cover",
	},
	imagePlaceholder: {
		height: 150,
		justifyContent: "center",
		alignItems: "center",
		gap: 8,
	},
	placeholderText: {
		color: "#888",
		fontSize: 14,
	},
	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	textArea: {
		minHeight: 80,
		textAlignVertical: "top",
	},
	toggleRow: {
		flexDirection: "row",
		gap: 8,
		marginTop: 8,
		flexWrap: "wrap",
	},
	toggleButton: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 10,
		paddingHorizontal: 10,
		paddingVertical: 8,
		backgroundColor: "#f7f7f7",
	},
	toggleButtonActive: {
		backgroundColor: "#007AFF",
		borderColor: "#007AFF",
	},
	toggleLabel: {
		color: "#333",
		fontWeight: "600",
	},
	toggleLabelActive: {
		color: "#fff",
	},
	helper: {
		fontSize: 12,
		color: "#666",
		marginTop: 4,
		textAlign: "right",
	},
	error: {
		color: "#ff4444",
		fontSize: 14,
		marginTop: 12,
	},
	encryptButton: {
		backgroundColor: "#007AFF",
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 20,
	},
	disabledButton: {
		opacity: 0.6,
	},
	encryptButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	plainButton: {
		backgroundColor: "#4a5568",
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 10,
	},
});
