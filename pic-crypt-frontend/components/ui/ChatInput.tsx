import AddIcon from "@/assets/images/add-image.svg";
import SentIcon from "@/assets/images/sent.svg";
import { useState } from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import { ThemedTextInput } from "../ThemedInput";
import { ThemedSvg } from "../ThemedSvg";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { ThemedModal } from "../ThemedModal";
import EncryptPopup from "./EncryptPopup";
import { buildAbsoluteUrl } from "@/utils/lib";

type ChatInputProps = {
	onSend(text: string, image: string | null, selfDestructType?: SelfDestructType): void;
};

type SelfDestructType = "NONE" | "ON_READ" | "TIME_BASED";

export default function ChatInput({ onSend }: ChatInputProps) {
	const [text, setText] = useState("");
	const [image, setImage] = useState<string | null>(null);
	const [showEncryptPopup, setShowEncryptPopup] = useState(false);
	const [selfDestructType, setSelfDestructType] = useState<SelfDestructType>("NONE");

	let imageUrl = buildAbsoluteUrl(image);

	function openEncryptPopup() {
		setShowEncryptPopup(true);
	}

	function handleEncrypted(encryptedImageUri: string, destructType: SelfDestructType) {
		setImage(encryptedImageUri);
		setSelfDestructType(destructType);
	}

	function send() {
		if (!text && !image) return;
		onSend(text, image, selfDestructType);
		setText("");
		setImage(null);
		setSelfDestructType("NONE");
	}

	return (
		<ThemedView style={styles.wrapper}>
			{image && (
				<ThemedView style={styles.imagePreviewWrapper}>
					<Pressable
						onPress={() => {
							setImage(null);
							setSelfDestructType("NONE");
						}}
						style={styles.deleteButton}
					>
						<ThemedText>X</ThemedText>
					</Pressable>
					<Image source={{ uri: imageUrl }} style={styles.imagePreview} />
				</ThemedView>
			)}

			<ThemedView style={styles.inputRow}>
				<ThemedTextInput
					placeholder="Написати повідомлення..."
					value={text}
					onChangeText={setText}
					style={styles.textInput}
				/>

				<Pressable onPress={openEncryptPopup}>
					<ThemedSvg IconComponent={AddIcon} fill="#007AFF" />
				</Pressable>
				<Pressable onPress={send} style={{ marginLeft: 8 }}>
					<ThemedSvg IconComponent={SentIcon} fill="#007AFF" />
				</Pressable>
			</ThemedView>

			<ThemedModal visible={showEncryptPopup} onRequestClose={() => setShowEncryptPopup(false)}>
				<EncryptPopup onClose={() => setShowEncryptPopup(false)} onEncrypted={handleEncrypted} />
			</ThemedModal>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		paddingHorizontal: 10,
		paddingTop: 6,
		paddingBottom: 10,
		gap: 8,
	},

	inputRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		borderRadius: 30,
	},
	textInput: {
		flex: 1,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
	},
	imagePreviewWrapper: {
		flexDirection: "column",
		alignSelf: "flex-end",
		borderRadius: 10,
		overflow: "hidden",
	},

	imagePreview: {
		width: 120,
		height: 120,
		borderRadius: 10,
	},

	deleteButton: {
		marginTop: 6,
		paddingHorizontal: 10,
		paddingVertical: 6,
		backgroundColor: "#3399ff",
		borderRadius: 8,
		alignItems: "center",
		alignSelf: "flex-end",
	},
});
