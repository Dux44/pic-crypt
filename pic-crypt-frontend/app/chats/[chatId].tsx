import { ThemedText } from "@/components/ThemedText";
import ChatInput from "@/components/ui/ChatInput";
import { MessageItem } from "@/components/ui/MessageItem";
import { selectChat, selectMessages } from "@/redux/selectors";
import { RootState } from "@/redux/store";
import { useAuth } from "@/utils/AuthContext";
import { buildAbsoluteUrl } from "@/utils/lib";
import { realtimeManager } from "@/utils/RealtimeManager";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import ChatPopup from "@/components/ui/ChatPopup";
import { ThemedModal } from "@/components/ThemedModal";

type ConversationParams = {
	chatId: string;
};

type SelfDestructType = "NONE" | "ON_READ" | "TIME_BASED";

export default function ConversationScreen() {
	const { userId } = useAuth();
	const { chatId } = useLocalSearchParams<ConversationParams>();
	const navigation = useNavigation();
	const [isInfoVisible, setInfoVisible] = useState(false);

	const numericId = Number(chatId);
	const messages = useSelector((state: RootState) => selectMessages(state, numericId));
	const chat = useSelector((state: RootState) => selectChat(state, numericId));
	const listRef = useRef<FlatList>(null);

	const isFirstRender = useRef(true);

	let chatTitle = "";
	let chatUrl = "";

	if (chat) {
		if (chat.isGroup) {
			chatUrl = buildAbsoluteUrl(chat.avatarUrl);
			chatTitle = chat.title;
		} else {
			const otherUser = chat.members.find((m) => m.memberId !== userId);
			chatUrl = buildAbsoluteUrl(otherUser.avatarUrl);
			chatTitle = otherUser.username;
		}
	}

	const safeMessages = useMemo(
		() => messages.filter((m): m is NonNullable<typeof m> => Boolean(m && m.id !== undefined)),
		[messages]
	);

	const send = useCallback(
		(text: string, image: string | null, destructType: SelfDestructType = "NONE") => {
			if (!userId) return;
			if (!text && !image) return;

			const selfDestructType = destructType === "NONE" ? undefined : destructType;

			const newMessage = {
				chatId: numericId,
				senderId: userId,
				content: text,
				mediaUrl: image ?? undefined,
				selfDestructType,
			};

			realtimeManager.emit("message", "add", newMessage);
		},
		[numericId, userId]
	);

	// Скрол до низу при першому відкритті
	useLayoutEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			requestAnimationFrame(() => {
				listRef.current?.scrollToOffset({ offset: 0, animated: false });
			});
		}
	}, []);

	// Скрол при новому повідомленні
	useLayoutEffect(() => {
		if (!isFirstRender.current && safeMessages.length > 0) {
			requestAnimationFrame(() => {
				listRef.current?.scrollToIndex({ index: 0, animated: true });
			});
		}
	}, [safeMessages.length]);

	// Заголовок
	useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: true,
			headerTitle: () => (
				<View style={styles.headerContainer}>
					{chatUrl && <Image source={{ uri: chatUrl }} style={styles.avatar} />}
					<Pressable onPress={() => setInfoVisible(true)}>
						<ThemedText style={styles.headerText}>{chatTitle}</ThemedText>
					</Pressable>
				</View>
			),
		});
	}, [chatTitle, chatUrl, navigation]);

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
		>
			<SafeAreaView style={{ flex: 1 }}>
				<FlatList
					ref={listRef}
					data={[...safeMessages].reverse()} // інвертуємо для scroll down
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<MessageItem
							id={item.id}
							chatId={item.chatId}
							content={item.content}
							senderId={item.senderId}
							mediaUrl={item.mediaUrl}
							createdAt={item.createdAt}
							selfDestructType={item.selfDestructType}
							viewCount={item.viewCount}
						/>
					)}
					inverted
					onEndReachedThreshold={0.1}
					onEndReached={() => {
						// Тут можна підвантажувати старі повідомлення
						console.log("Завантажити старі повідомлення");
					}}
				/>
				<ChatInput onSend={send} />
				<ThemedModal visible={isInfoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
					<ChatPopup chat={chat ?? null} onClose={() => setInfoVisible(false)} />
				</ThemedModal>
			</SafeAreaView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	headerContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		marginRight: 10,
	},
	headerText: {
		fontSize: 18,
		fontWeight: "bold",
	},
});
