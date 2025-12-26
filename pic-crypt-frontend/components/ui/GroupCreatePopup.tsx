import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedModal } from "@/components/ThemedModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedTextInput } from "@/components/ThemedInput";
import { realtimeManager } from "@/utils/RealtimeManager";
import { useAuth } from "@/utils/AuthContext";
import { User } from "@/redux/types";
import { UserSearchPopup } from "@/components/ui/UserSearchPopup";

interface GroupCreatePopupProps {
	visible: boolean;
	onClose: () => void;
	onCreated?: (chatId: number) => void;
}

export function GroupCreatePopup({ visible, onClose, onCreated }: GroupCreatePopupProps) {
	const { userId } = useAuth();
	const [title, setTitle] = useState("");
	const [bio, setBio] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showSearch, setShowSearch] = useState(false);
	const [additionalMembers, setAdditionalMembers] = useState<User[]>([]);

	useEffect(() => {
		if (!visible) {
			setTitle("");
			setBio("");
			setError(null);
			setLoading(false);
			setAdditionalMembers([]);
		}
	}, [visible]);

	const handleAddMember = useCallback(
		(user: User) => {
			if (!userId || user.id === userId) return;
			setAdditionalMembers((prev) => {
				if (prev.some((u) => u.id === user.id)) return prev;
				return [...prev, user];
			});
			setShowSearch(false);
		},
		[userId]
	);

	const handleRemoveMember = useCallback((id: number) => {
		setAdditionalMembers((prev) => prev.filter((u) => u.id !== id));
	}, []);

	const handleCreate = useCallback(async () => {
		const trimmedTitle = title.trim();
		const trimmedBio = bio.trim();

		if (!trimmedTitle) {
			setError("Group name is required");
			return;
		}

		if (!userId) {
			setError("User is not authenticated");
			return;
		}

		setLoading(true);
		setError(null);

		const chatData = {
			isGroup: true,
			title: trimmedTitle,
			description: trimmedBio || undefined,
			allowInvites: true,
			members: [
				{ memberId: userId, role: "OWNER" },
				...additionalMembers.map((m) => ({ memberId: m.id, role: "MEMBER" })),
			],
		} as const;

		try {
			const created = await realtimeManager.emit("chat", "add", chatData);
			if (created?.id) {
				onCreated?.(created.id);
				onClose();
			}
		} catch (e) {
			setError("Failed to create group");
		} finally {
			setLoading(false);
		}
	}, [additionalMembers, bio, onClose, onCreated, title, userId]);

	return (
		<ThemedModal visible={visible} onRequestClose={onClose} cardStyle={styles.card}>
			<ThemedView style={styles.headerRow}>
				<ThemedText style={styles.headerText}>Create Group</ThemedText>
			</ThemedView>

			<View style={styles.fieldGroup}>
				<ThemedText style={styles.label}>Group name</ThemedText>
				<ThemedTextInput
					value={title}
					onChangeText={setTitle}
					placeholder="Enter group name"
					editable={!loading}
					autoCapitalize="sentences"
				/>
			</View>

			<View style={styles.fieldGroup}>
				<ThemedText style={styles.label}>Bio</ThemedText>
				<ThemedTextInput
					value={bio}
					onChangeText={setBio}
					placeholder="Describe your group"
					editable={!loading}
					multiline
					numberOfLines={3}
					style={styles.bioInput}
				/>
			</View>

			<View style={styles.fieldGroup}>
				<ThemedText style={styles.label}>Учасники</ThemedText>
				<View style={styles.memberRow}>
					<ThemedText style={styles.memberBadge}>Ви (OWNER)</ThemedText>
					{additionalMembers.map((member) => (
						<Pressable key={member.id} style={styles.memberBadge} onPress={() => handleRemoveMember(member.id)}>
							<ThemedText>{member.username} ✕</ThemedText>
						</Pressable>
					))}
				</View>
				<Pressable style={[styles.button, styles.secondary]} onPress={() => setShowSearch(true)} disabled={loading}>
					<ThemedText style={styles.buttonText}>Додати учасника</ThemedText>
				</Pressable>
			</View>

			{error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

			<View style={styles.actionsRow}>
				<Pressable style={[styles.button, styles.secondary]} onPress={onClose} disabled={loading}>
					<ThemedText style={styles.buttonText}>Cancel</ThemedText>
				</Pressable>
				<Pressable style={[styles.button, styles.primary]} onPress={handleCreate} disabled={loading}>
					<ThemedText style={[styles.buttonText, styles.primaryText]}>{loading ? "Creating..." : "Create"}</ThemedText>
				</Pressable>
			</View>
			<UserSearchPopup
				visible={showSearch}
				onClose={() => setShowSearch(false)}
				onSelectUser={handleAddMember}
				title="Додати учасника"
				excludeUserIds={[userId, ...additionalMembers.map((m) => m.id)].filter(
					(v): v is number => typeof v === "number"
				)}
			/>
		</ThemedModal>
	);
}

const styles = StyleSheet.create({
	card: {
		gap: 12,
	},
	headerRow: {
		alignItems: "center",
		marginBottom: 4,
	},
	headerText: {
		fontSize: 18,
		fontWeight: "700",
	},
	fieldGroup: {
		gap: 6,
	},
	label: {
		fontSize: 14,
		opacity: 0.8,
	},
	bioInput: {
		minHeight: 80,
		textAlignVertical: "top",
	},
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 10,
		marginTop: 4,
	},
	button: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 10,
	},
	secondary: {},
	primary: {
		backgroundColor: "#007AFF",
	},
	buttonText: {
		fontWeight: "600",
	},
	primaryText: {
		color: "white",
	},
	errorText: {
		color: "#B00020",
		fontSize: 13,
	},
});
