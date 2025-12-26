import TrashIcon from "@/assets/images/trash.svg";
import { buildAbsoluteUrl } from "@/utils/lib";
import { useTheme } from "@react-navigation/native";
import React, { memo } from "react";
import { Alert, Image, Platform, Pressable, StyleSheet } from "react-native";
import { ThemedSvg } from "../ThemedSvg";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

export type FriendItemProps = {
	friendId: number;
	username: string;
	avatarUrl: string;
	onDelete: (id: number) => void;
	onOpenChat: (id: number) => void;
};

const FriendItemComponent = ({ friendId, username, avatarUrl, onDelete, onOpenChat }: FriendItemProps) => {
	const { colors } = useTheme();
	const placeholderAvatar = "https://i.pravatar.cc/150?img=1";
	const resolvedAvatarUrl = buildAbsoluteUrl(avatarUrl) || placeholderAvatar;

	const askDelete = () => {
		if (Platform.OS === "web") {
			const confirmed = window.confirm(`Ви точно хочете видалити ${username}?`);
			if (confirmed) {
				onDelete(friendId);
			}
			return;
		}

		Alert.alert("Видалити друга", `Ви точно хочете видалити ${username}?`, [
			{ text: "Скасувати", style: "cancel" },
			{ text: "Видалити", style: "destructive", onPress: () => onDelete(friendId) },
		]);
	};

	return (
		<Pressable style={[styles.container, { borderColor: colors.border }]} onPress={() => onOpenChat(friendId)}>
			<Image source={{ uri: resolvedAvatarUrl }} style={styles.avatar} />
			<ThemedView style={styles.username}>
				<ThemedText style={styles.usernameText}>{username}</ThemedText>
			</ThemedView>

			<Pressable style={styles.deleteButton} onPress={askDelete}>
				<ThemedSvg IconComponent={TrashIcon} width={35} height={35} />
			</Pressable>
		</Pressable>
	);
};

export const FriendItem = memo(FriendItemComponent);

const styles = StyleSheet.create({
	container: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		flexDirection: "row",
		alignItems: "center",
	},
	avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
	username: { flex: 1 },
	usernameText: { fontSize: 16, fontWeight: "600" },
	deleteButton: { padding: 8 },
});
