import GroupIcon from "@/assets/images/group.svg";
import { ThemedSvg } from "@/components/ThemedSvg";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ChatItem } from "@/components/ui/ChatItem";
import { selectAllChatsSorted } from "@/redux/selectors";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { GroupCreatePopup } from "@/components/ui/GroupCreatePopup";
import { router } from "expo-router";

export default function ChatsScreen() {
	const chats = useSelector(selectAllChatsSorted);
	const [showCreateGroup, setShowCreateGroup] = useState(false);

	const handleGroupCreated = useCallback((chatId: number) => {
		setShowCreateGroup(false);
		router.push(`/chats/${chatId}`);
	}, []);

	const handleCreateGroup = () => {
		setShowCreateGroup(true);
	};

	const handleCloseCreateGroup = () => setShowCreateGroup(false);

	return (
		<ThemedView style={styles.container}>
			<ThemedView style={styles.header}>
				<ThemedView style={{ width: 35 }} />
				<ThemedText style={styles.headerText}>Чати</ThemedText>
				<Pressable style={styles.groupButton} onPress={handleCreateGroup}>
					<ThemedSvg IconComponent={GroupIcon} fill="#007AFF" width={35} height={35} />
				</Pressable>
			</ThemedView>

			{chats.length > 0 ? (
				<FlatList
					style={styles.list}
					data={chats}
					keyExtractor={(chat) => chat.id.toString()}
					renderItem={({ item }) => <ChatItem chatId={item.id} />}
				/>
			) : (
				<ThemedView style={styles.emptyContainer}>
					<ThemedText style={styles.noChatsText}>У вас немає чатів. Почніть новий чат або створіть групу!</ThemedText>
				</ThemedView>
			)}
			<GroupCreatePopup visible={showCreateGroup} onClose={handleCloseCreateGroup} onCreated={handleGroupCreated} />
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		gap: 20,
	},
	list: {},
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

	groupButton: {
		width: 35,
		height: 35,
	},
	chatList: {
		flex: 1,
	},
	button: {
		position: "absolute",
		bottom: 25,
		right: 25,
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#007AFF",
		alignItems: "center",
		justifyContent: "center",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
	buttonText: {
		fontSize: 30,
		lineHeight: 30,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	noChatsText: {
		textAlign: "center",
		fontSize: 16,
		opacity: 0.7,
	},
});
