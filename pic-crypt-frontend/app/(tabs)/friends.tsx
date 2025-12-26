import AddFriendIcon from "@/assets/images/add.svg";
import { ThemedSvg } from "@/components/ThemedSvg";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FriendItem } from "@/components/ui/FriendItem";
import { selectAllFriendUsers } from "@/redux/selectors";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { realtimeManager } from "../../utils/RealtimeManager";
import { getChat } from "@/api/chats";
import { useAuth } from "@/utils/AuthContext";
import { User } from "@/redux/types";
import { UserSearchPopup } from "@/components/ui/UserSearchPopup";
import { addFriend as addFriendApi, deleteFriend as removeFriendApi } from "@/api/friends";
import { addFriend as addFriendStore, removeFriend as removeFriendStore } from "@/redux/friendsSlice";

export default function FriendsScreen() {
	const { userId } = useAuth();
	const friends = useSelector(selectAllFriendUsers);
	const dispatch = useDispatch();
	const friendIds = useMemo(() => friends.map((f) => f.id), [friends]);
	const [showSearch, setShowSearch] = useState(false);
	const handleOpenSearch = () => setShowSearch(true);

	const confirmCreateChat = (onConfirm: () => void) => {
		const title = "Почати новий чат?";
		const message = "Чату ще немає. Створити діалог з цим другом?";

		if (Platform.OS === "web") {
			const ok = window.confirm(`${title}\n\n${message}`);
			if (ok) onConfirm();
			return;
		}

		Alert.alert(title, message, [
			{ text: "Скасувати", style: "cancel" },
			{ text: "Створити", onPress: onConfirm },
		]);
	};

	const handleOpenChat = useCallback(
		async (friendId: number) => {
			const targetFriendId = friendId;

			let chat: any = null;
			try {
				chat = await getChat(targetFriendId);
				console.log("Fetched chat:", chat);
			} catch (e) {
				console.warn("getChat failed:", e);
			}

			if (chat?.id) {
				router.push(`/chats/${chat.id}`);
				return;
			}

			confirmCreateChat(async () => {
				const chatData = {
					isGroup: false,
					members: [
						{ memberId: userId, role: "OWNER" },
						{ memberId: targetFriendId, role: "OWNER" },
					],
				};

				const created = await realtimeManager.emit("chat", "add", chatData);
				if (created?.id) {
					router.push(`/chats/${created.id}`);
				}
			});
		},
		[userId, router]
	);

	const handleDelete = useCallback(
		async (friendId: number) => {
			console.log("Deleting friend with ID:", friendId);
			await removeFriendApi(friendId);
			dispatch(removeFriendStore(friendId));
		},
		[dispatch]
	);

	const handleSelectUser = useCallback(
		async (user: User) => {
			if (user.id === userId) return;
			setShowSearch(false);
			await handleOpenChat(user.id);
		},
		[handleOpenChat, userId]
	);

	const handleAddFriend = useCallback(
		async (user: User) => {
			if (user.id === userId) return;
			if (friendIds.includes(user.id)) {
				Alert.alert("Уже в друзях", "Цей користувач вже є у ваших друзях");
				return;
			}
			try {
				const created = await addFriendApi(user.id);
				dispatch(addFriendStore(created));
				Alert.alert("Додано", "Користувач доданий до друзів");
			} catch (e) {
				Alert.alert("Помилка", "Не вдалося додати у друзі");
			}
		},
		[dispatch, friendIds, userId]
	);

	return (
		<ThemedView style={styles.container}>
			<ThemedView style={styles.header}>
				<ThemedView style={{ width: 35 }} />
				<ThemedText style={styles.headerText}>Друзі</ThemedText>

				<Pressable style={styles.addFriend} onPress={handleOpenSearch}>
					<ThemedSvg IconComponent={AddFriendIcon} fill="#007AFF" width={35} height={35} />
				</Pressable>
			</ThemedView>

			{friends.length > 0 ? (
				<FlatList
					data={friends}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<FriendItem
							friendId={item.id}
							username={item.username}
							avatarUrl={item.avatarUrl}
							onOpenChat={handleOpenChat}
							onDelete={handleDelete}
						/>
					)}
				/>
			) : (
				<ThemedView style={styles.emptyContainer}>
					<ThemedText style={styles.noFriendsText}>У вас немає друзів. Додайте їх, щоб почати спілкування!</ThemedText>
				</ThemedView>
			)}
			<UserSearchPopup
				visible={showSearch}
				onClose={() => setShowSearch(false)}
				onSelectUser={handleSelectUser}
				title="Знайти користувача"
				actionLabel="Додати в друзі"
				onActionPress={handleAddFriend}
				excludeUserIds={[userId, ...friendIds]}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, gap: 20 },
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
	addFriend: {},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	noFriendsText: {
		textAlign: "center",
		fontSize: 16,
		opacity: 0.7,
	},
});
