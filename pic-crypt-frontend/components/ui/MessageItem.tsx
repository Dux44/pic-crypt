import CryptIcon from "@/assets/images/crypt.svg";
import { selectUser } from "@/redux/selectors";
import { RootState } from "@/redux/store";
import { useAuth } from "@/utils/AuthContext";
import { buildAbsoluteUrl } from "@/utils/lib";
import { memo, useState } from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { ThemedSvg } from "../ThemedSvg";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { ThemedModal } from "../ThemedModal";
import DecryptPopup from "./DecryptPopup";

type ChatItemProps = {
	id: number;
	chatId: number;
	content: string;
	senderId: number;
	mediaUrl?: string;
	createdAt: Date;
	viewCount: number;
	selfDestructType?: "NONE" | "ON_READ" | "TIME_BASED";
};

const MessageItemComponent = ({
	id,
	chatId,
	content,
	senderId,
	mediaUrl,
	createdAt,
	selfDestructType,
	viewCount,
}: ChatItemProps) => {
	const { userId } = useAuth();
	const [modalVisible, setModalVisible] = useState(false);

	const user = useSelector((state: RootState) => selectUser(state, senderId));
	const isMine = userId === senderId;
	const avatarUri = buildAbsoluteUrl(user.avatarUrl);
	const mediaUri = buildAbsoluteUrl(mediaUrl);

	const decryptImage = async () => {
		if (!mediaUri) return;
		setModalVisible(true);
	};

	return (
		<ThemedView style={isMine ? styles.myWrapper : styles.otherWrapper}>
			{!isMine && <Image style={[styles.avatar, styles.userInfo]} source={{ uri: avatarUri }} />}

			<ThemedView style={[styles.container, isMine ? styles.my : styles.other]}>
				<ThemedText style={styles.username}>{user.username}</ThemedText>
				{mediaUri && (
					<>
						<Pressable onPress={() => setModalVisible(true)}>
							<Image source={{ uri: mediaUri }} style={styles.media} resizeMode="cover" />
						</Pressable>
						<Pressable style={styles.decrypt} onPress={decryptImage}>
							<ThemedSvg fill="#ffffffff" IconComponent={CryptIcon} />
						</Pressable>
					</>
				)}
				<ThemedText style={styles.content}>{content}</ThemedText>
				<ThemedText style={styles.sentAt}>
					{new Date(createdAt).toLocaleTimeString([], {
						year: "2-digit",
						month: "2-digit",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
					})}
				</ThemedText>
			</ThemedView>

			{isMine && <Image style={[styles.avatar, styles.userInfo]} source={{ uri: avatarUri }} />}

			<ThemedModal visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
				<DecryptPopup
					selfDestructType={selfDestructType}
					viewCount={viewCount}
					id={id}
					chatId={chatId}
					imageUri={mediaUri}
					onClose={() => setModalVisible(false)}
				/>
			</ThemedModal>
		</ThemedView>
	);
};

export const MessageItem = memo(MessageItemComponent);

const styles = StyleSheet.create({
	otherWrapper: {
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "flex-start",
		marginVertical: 4,
		marginHorizontal: 8,
	},

	myWrapper: {
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "flex-end",
		marginVertical: 4,
		marginHorizontal: 8,
	},
	userInfo: {
		flexDirection: "column",
		alignItems: "center",
		marginHorizontal: 8,
	},
	container: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 12,
		maxWidth: "80%",
	},
	other: {
		backgroundColor: "#999d9eff",
	},
	my: {
		backgroundColor: "#0ea0dfff",
	},
	content: {
		fontSize: 16,
		marginBottom: 4,
	},
	sentAt: {
		fontSize: 12,
		color: "#555",
		alignSelf: "flex-end",
	},
	media: {
		width: 320,
		height: 320,
		borderRadius: 8,
		marginBottom: 8,
	},
	decrypt: {
		position: "absolute",
		top: 35,
		right: 8,
		zIndex: 10,
	},
	decryptIcon: {
		width: 28,
		height: 28,
	},
	modalBackground: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.9)",
		justifyContent: "center",
		alignItems: "center",
	},
	fullScreenImage: {
		width: "100%",
		height: "100%",
	},
	username: {
		fontWeight: "bold",
	},
	avatar: {
		width: 60,
		height: 60,
		borderRadius: 20,
		marginRight: 12,
	},
});
