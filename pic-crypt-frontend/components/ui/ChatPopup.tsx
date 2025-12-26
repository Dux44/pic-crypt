import { ThemedTextInput } from "../ThemedInput";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Alert, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ThemedSwitch } from "../ThemedSwitch";
import { useAuth } from "@/utils/AuthContext";
import { buildAbsoluteUrl } from "@/utils/lib";
import { Chat, User } from "@/redux/types";
import { realtimeManager } from "@/utils/RealtimeManager";
import ChatMemberItem from "./ChatMemberItem";
import { UserSearchPopup } from "@/components/ui/UserSearchPopup";
import { useDispatch } from "react-redux";

type ChatPopupParams = {
	chat: Chat | null;
	onClose?: () => void;
};

export default function ChatPopup({ chat, onClose }: ChatPopupParams) {
	const dispatch = useDispatch();
	const { userId } = useAuth();
	const isOwner = chat?.members.find((member) => member.memberId === userId)?.role === "OWNER";
	const isGroup = chat?.isGroup ?? false;
	const avatarUri = chat?.avatarUrl ? buildAbsoluteUrl(chat.avatarUrl) : undefined;
	const roleLabel = isOwner ? "Власник" : "Учасник";
	const otherMember = !isGroup ? chat?.members.find((member) => member.memberId !== userId) : undefined;

	const [title, setTitle] = useState(chat?.title ?? "");
	const [description, setDescription] = useState(chat?.description ?? "");
	const [allowInvites, setallowInvites] = useState(chat?.allowInvites ?? false);
	const [showAddMember, setShowAddMember] = useState(false);

	useEffect(() => {
		setTitle(chat?.title ?? "");
		setDescription(chat?.description ?? "");
		setallowInvites(chat?.allowInvites ?? false);
	}, [chat?.title, chat?.description, chat?.allowInvites]);

	const saveUpdates = async (updates: Partial<Chat>) => {
		if (!chat) return;
		try {
			realtimeManager.emit("chat", "update", { id: chat.id, ...updates });
			Alert.alert("Зміни збережено");
		} catch (error: any) {
			Alert.alert("Помилка", error?.message || "Не вдалося оновити чат");
		}
	};

	const handleDeleteChat = async () => {
		console.log("Deleting chat", chat);
		await realtimeManager.emit("chat", "remove", { id: chat?.id });
	};

	const canRemoveMember = (memberId: number, allowSelf = false) => {
		if (!chat) return false;
		const isSelf = memberId === userId;

		if (isSelf) {
			if (!allowSelf) return false;
			return !isOwner;
		}

		if (!isGroup) return false;
		if (!isOwner) return false;
		return true;
	};

	const handleRemoveMember = async (chatId: number, memberId: number, allowSelf = false) => {
		if (!canRemoveMember(memberId, allowSelf)) {
			Alert.alert("Неможливо видалити", "Ви не можете видалити цього учасника");
			return;
		}
		await realtimeManager.emit("chat", "remove-member", { id: chatId, memberId });
	};

	const handleAddMember = useCallback(
		async (user: User) => {
			if (!chat || !chat.id) return;
			if (chat.members.some((m) => m.memberId === user.id)) {
				Alert.alert("Учасник вже доданий");
				return;
			}

			try {
				await realtimeManager.emit("chat", "add-member", { id: chat.id, memberId: user.id, role: "MEMBER" });

				setShowAddMember(false);
			} catch (err) {
				Alert.alert("Помилка", "Не вдалося додати учасника");
			}
		},
		[chat, dispatch]
	);

	if (!chat) {
		return (
			<ThemedView>
				<ThemedText>Інформація недоступна</ThemedText>
			</ThemedView>
		);
	}

	const sortedMembers = [...chat.members].sort((a, b) => a.memberId - b.memberId);
	const chatTitle = chat.title || (isGroup ? "Груповий чат" : "Приватний чат");

	return (
		<ThemedView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<ThemedView style={styles.headerRow}>
					<ThemedView style={styles.avatarWrapper}>
						{avatarUri ? (
							<Image source={{ uri: avatarUri }} style={styles.avatar} />
						) : (
							<ThemedView style={[styles.avatar, styles.avatarPlaceholder]}>
								<ThemedText style={styles.avatarInitial}>{chatTitle.charAt(0)}</ThemedText>
							</ThemedView>
						)}
					</ThemedView>
					<ThemedView style={styles.headerTextBlock}>
						<ThemedText style={styles.chatTitle}>{chatTitle}</ThemedText>
						<ThemedView style={styles.badgeRow}>
							<ThemedView style={[styles.badge, isGroup ? styles.badgeGroup : styles.badgePrivate]}>
								<ThemedText style={styles.badgeText}>{isGroup ? "Група" : "Приватний"}</ThemedText>
							</ThemedView>
							<ThemedView style={[styles.badge, styles.badgeRole]}>
								<ThemedText style={styles.badgeText}>{roleLabel}</ThemedText>
							</ThemedView>
						</ThemedView>
						{!!description && <ThemedText style={styles.subtitle}>{description}</ThemedText>}
					</ThemedView>
					{onClose && (
						<Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
							<ThemedText style={styles.closeButtonText}>✕</ThemedText>
						</Pressable>
					)}
				</ThemedView>

				{isGroup && (
					<>
						<ThemedView style={styles.sectionCard}>
							<ThemedText style={styles.label}>Назва чату</ThemedText>
							<ThemedTextInput
								editable={isGroup && isOwner}
								value={title}
								onChangeText={setTitle}
								style={[styles.input, !(isGroup && isOwner) && styles.readonly]}
								placeholder="Назва"
							/>
							{isOwner && (
								<Pressable onPress={() => saveUpdates({ title })} style={[styles.button, styles.buttonPrimary]}>
									<ThemedText style={styles.buttonText}>Оновити назву</ThemedText>
								</Pressable>
							)}
						</ThemedView>

						<ThemedView style={styles.sectionCard}>
							<ThemedText style={styles.label}>Опис</ThemedText>
							<ThemedTextInput
								editable={isGroup && isOwner}
								value={description}
								onChangeText={setDescription}
								style={[styles.input, styles.multilineInput, !(isGroup && isOwner) && styles.readonly]}
								placeholder="Опис"
								multiline
							/>
							{isGroup && isOwner && (
								<Pressable onPress={() => saveUpdates({ description })} style={[styles.button, styles.buttonPrimary]}>
									<ThemedText style={styles.buttonText}>Оновити опис</ThemedText>
								</Pressable>
							)}
						</ThemedView>
					</>
				)}
				{isOwner && isGroup && (
					<ThemedView style={styles.sectionCard}>
						<ThemedView style={styles.switchRow}>
							<ThemedText style={styles.label}>Дозволити приєднання:</ThemedText>
							<ThemedText style={styles.switchValue}>{allowInvites ? "Так" : "Ні"}</ThemedText>
						</ThemedView>
						<ThemedSwitch
							value={allowInvites}
							onValueChange={(next) => {
								setallowInvites(next);
								saveUpdates({ allowInvites: next });
							}}
						/>
					</ThemedView>
				)}

				{!isGroup && true && (
					<ThemedView style={styles.sectionCard}>
						<ThemedText style={styles.label}>Біографія</ThemedText>
						<ThemedText style={styles.subtitle}>{otherMember.bio}</ThemedText>
					</ThemedView>
				)}

				<ThemedView style={styles.sectionCard}>
					<ThemedView style={styles.sectionHeaderRow}>
						<ThemedText style={styles.label}>Учасники</ThemedText>
						{isGroup && (isOwner || allowInvites) && (
							<Pressable onPress={() => setShowAddMember(true)}>
								<ThemedText style={styles.helperText}>Додати учасника</ThemedText>
							</Pressable>
						)}
					</ThemedView>
					<ScrollView style={styles.membersScroll} contentContainerStyle={styles.membersList}>
						{sortedMembers.map((member) => (
							<ChatMemberItem
								key={member.memberId}
								isGroup={isGroup}
								member={member}
								onRemove={handleRemoveMember}
								canRemove={canRemoveMember(member.memberId)}
							/>
						))}
					</ScrollView>
				</ThemedView>

				<ThemedView style={styles.actionsRow}>
					{isOwner ? (
						<Pressable onPress={handleDeleteChat} style={[styles.button, styles.buttonDanger]}>
							<ThemedText style={styles.buttonText}>Видалити чат</ThemedText>
						</Pressable>
					) : (
						<Pressable
							onPress={() => handleRemoveMember(chat.id, userId, true)}
							style={[styles.button, styles.buttonSecondary]}
						>
							<ThemedText style={styles.buttonText}>Вийти з чату</ThemedText>
						</Pressable>
					)}
				</ThemedView>

				<UserSearchPopup
					visible={showAddMember}
					onClose={() => setShowAddMember(false)}
					onSelectUser={handleAddMember}
					title="Додати учасника"
					excludeUserIds={chat ? chat.members.map((m) => m.memberId) : []}
				/>
			</ScrollView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		gap: 16,
		padding: 16,
	},
	headerRow: {
		flexDirection: "row",
		gap: 14,
		alignItems: "center",
		justifyContent: "space-between",
	},
	avatarWrapper: {
		width: 90,
		height: 90,
		borderRadius: 20,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#e0e0e0",
	},
	avatar: {
		width: "100%",
		height: "100%",
		borderRadius: 20,
	},
	avatarPlaceholder: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#f1f1f1",
	},
	avatarInitial: {
		fontSize: 26,
		fontWeight: "700",
	},
	headerTextBlock: {
		flex: 1,
		gap: 6,
	},
	chatTitle: {
		fontSize: 18,
		fontWeight: "700",
	},
	subtitle: {
		fontSize: 14,
		color: "#666",
	},
	badgeRow: {
		flexDirection: "row",
		gap: 8,
		alignItems: "center",
	},
	closeButton: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 12,
		backgroundColor: "#edf2ff",
		borderWidth: 1,
		borderColor: "#d6e4ff",
	},
	closeButtonText: {
		fontWeight: "800",
		fontSize: 14,
		color: "#1c4ed8",
	},
	badge: {
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 10,
		paddingVertical: 6,
		alignItems: "center",
		justifyContent: "center",
	},
	badgeGroup: { backgroundColor: "#e9f2ff" },
	badgePrivate: { backgroundColor: "#f2f2f2" },
	badgeRole: { backgroundColor: "#ffe9e6" },
	badgeText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#333",
	},
	sectionCard: {
		gap: 10,
		padding: 12,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#e0e0e0",
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
	},
	input: {
		borderWidth: 1,
		borderColor: "#d6d6d6",
		borderRadius: 10,
		padding: 12,
		fontSize: 15,
	},
	multilineInput: {
		minHeight: 80,
		textAlignVertical: "top",
	},
	readonly: {
		opacity: 0.8,
	},
	switchRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	switchValue: {
		fontWeight: "600",
	},
	sectionHeaderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	helperText: {
		fontSize: 12,
		color: "#666",
	},
	membersList: {
		gap: 10,
	},
	membersScroll: {
		maxHeight: 280,
	},
	button: {
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
	buttonPrimary: {
		backgroundColor: "#007AFF",
	},
	buttonSecondary: {
		backgroundColor: "#4a5568",
	},
	buttonDanger: {
		backgroundColor: "#ff3b30",
	},
	buttonText: {
		color: "#fff",
		fontWeight: "700",
	},
	actionsRow: {
		flexDirection: "row",
		gap: 12,
	},
});
