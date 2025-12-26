import { selectChat, selectMessages, selectUser } from "@/redux/selectors";
import { RootState } from "@/redux/store";
import { useAuth } from "@/utils/AuthContext";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { memo, useMemo } from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { buildAbsoluteUrl } from "@/utils/lib";

type ChatItemProps = {
	chatId: number;
};

const ChatItemComponent = ({ chatId }: ChatItemProps) => {
	const { colors } = useTheme();
	const { userId } = useAuth();

	const chat = useSelector((state: RootState) => selectChat(state, chatId));
	const allMessages = useSelector((state: RootState) => (chat?.lastMessageId ? selectMessages(state, chat.id) : []));

	const lastMessage = useMemo(
		() => allMessages.find((msg) => msg.id === chat?.lastMessageId),
		[allMessages, chat?.lastMessageId]
	);

	let chatTitle = "";
	let chatUrl = "";

	if (chat) {
		if (chat.isGroup) {
			chatUrl = buildAbsoluteUrl(chat.avatarUrl);
			chatTitle = chat.title;
		} else {
			const otherUser = chat.members.find((m) => m.memberId !== userId) ?? chat.members[0];
			chatUrl = buildAbsoluteUrl(otherUser.avatarUrl);
			chatTitle = otherUser.username;
		}
	}

	return (
		<Pressable
			style={[styles.container, { borderColor: colors.border }]}
			onPress={() => router.push(`/chats/${chatId}`)}
		>
			<Image source={{ uri: chatUrl }} style={styles.avatar} />
			<ThemedView style={styles.left}>
				<ThemedText style={styles.title}>{chatTitle}</ThemedText>
				<ThemedText style={styles.lastMessage} numberOfLines={2} ellipsizeMode="tail">
					{lastMessage?.content || ""}
				</ThemedText>
			</ThemedView>
			<ThemedView style={styles.right}>
				<ThemedText style={styles.time}>
					{lastMessage
						? new Date(lastMessage.createdAt).toLocaleTimeString([], {
								year: "2-digit",
								month: "2-digit",
								day: "2-digit",
								hour: "2-digit",
								minute: "2-digit",
						  })
						: ""}
				</ThemedText>
			</ThemedView>
		</Pressable>
	);
};

export const ChatItem = memo(ChatItemComponent);

const styles = StyleSheet.create({
	container: {
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		flexDirection: "row",
		alignItems: "center",
	},
	left: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		marginBottom: 4,
		fontWeight: "600",
	},
	lastMessage: {
		fontSize: 14,
	},
	right: {
		alignItems: "flex-end",
	},
	time: {
		fontSize: 12,
		marginBottom: 6,
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 12,
	},
});
