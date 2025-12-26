import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet } from "react-native";
import { ThemedTextInput } from "../ThemedInput";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { decryptGif } from "@/api/steno";
import { realtimeManager } from "@/utils/RealtimeManager";
import { store } from "@/redux/store";
import { selectMessages } from "@/redux/selectors";

type DecryptPopupProps = {
	id: number;
	chatId: number;
	imageUri: string | undefined;
	onClose?: () => void;
	selfDestructType?: "NONE" | "ON_READ" | "TIME_BASED";
	viewCount: number;
};

export default function DecryptPopup({
	id,
	chatId,
	imageUri,
	selfDestructType,
	viewCount,
	onClose,
}: DecryptPopupProps) {
	const [password, setPassword] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const destructionTimerRef = useRef<NodeJS.Timeout | null>(null);

	const getNextLastMessageId = () => {
		const state = store.getState();
		const others = selectMessages(state, chatId).filter((msg) => msg.id !== id);
		if (!others.length) return null;

		const latest = others.reduce((acc, msg) => {
			if (!acc) return msg;
			const accTime = new Date(acc.createdAt).getTime();
			const msgTime = new Date(msg.createdAt).getTime();
			return msgTime >= accTime ? msg : acc;
		}, others[0]);

		return latest?.id ?? null;
	};

	const removeWithLastUpdate = () => {
		const nextLastId = getNextLastMessageId();
		realtimeManager.emit("message", "remove", { chatId, id });
		realtimeManager.emit("chat", "update", { id: chatId, lastMessageId: nextLastId });
	};

	const handleDecrypt = async () => {
		if (!imageUri) return;
		if (!password) {
			Alert.alert("Введіть пароль");
			return;
		}
		setLoading(true);
		try {
			const result = await decryptGif({ imageUri, password });
			const nextViewCount = (viewCount ?? 0) + 1;
			realtimeManager.emit("message", "update", {
				chatId,
				id,
				viewCount: nextViewCount,
				selfDestructType,
			});
			setContent(result);
			console.log({ selfDestructType, nextViewCount });
			if (selfDestructType === "ON_READ" && nextViewCount >= 3) {
				removeWithLastUpdate();
			}
			if (selfDestructType === "TIME_BASED") {
				if (!destructionTimerRef.current) {
					destructionTimerRef.current = setTimeout(() => {
						destructionTimerRef.current = null;
						removeWithLastUpdate();
					}, 30000);
				}
			}
		} catch (error: any) {
			Alert.alert("Помилка", error?.message || "Не вдалося розшифрувати зображення");
			setError(error.response?.data?.message || error.message || "Помилка розшифрування");
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setPassword("");
		setContent("");
		onClose?.();
	};

	return (
		<ThemedView style={styles.popup}>
			<Pressable onPress={handleClose} style={styles.closeButton}>
				<ThemedText style={styles.closeText}>✕</ThemedText>
			</Pressable>
			<ThemedText style={styles.title}>Розшифрування прихованого повідомлення</ThemedText>
			<ThemedText style={styles.label}>Введіть секретний пароль:</ThemedText>
			<ThemedTextInput value={password} onChangeText={setPassword} placeholder="Пароль" />

			{error && <ThemedText style={styles.error}>{error}</ThemedText>}

			<Pressable onPress={handleDecrypt} style={styles.actionButton} disabled={loading || !imageUri}>
				<ThemedText style={styles.actionText}>{loading ? "Розшифровка..." : "Розшифрувати"}</ThemedText>
			</Pressable>
			{content && (
				<ThemedView style={styles.resultBox}>
					<ThemedText style={styles.resultLabel}>Зашифрований текст:</ThemedText>
					<ThemedText>{content}</ThemedText>
				</ThemedView>
			)}
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	popup: {
		gap: 12,
		padding: 16,
		borderRadius: 16,
	},
	closeButton: {
		alignSelf: "flex-end",
		padding: 8,
	},
	closeText: {
		fontSize: 16,
		fontWeight: "700",
	},
	title: {
		fontWeight: "700",
		fontSize: 16,
	},
	label: {
		fontWeight: "600",
		fontSize: 14,
	},
	actionButton: {
		paddingVertical: 10,
		borderRadius: 12,
		alignItems: "center",
	},
	actionText: {
		fontWeight: "700",
	},
	resultBox: {
		borderWidth: 1,
		borderColor: "#e5e7eb",
		borderRadius: 12,
		padding: 10,
		gap: 6,
	},
	resultLabel: {
		fontWeight: "600",
	},
	error: {
		color: "#ff4444",
		fontSize: 14,
		marginTop: 12,
	},
});
