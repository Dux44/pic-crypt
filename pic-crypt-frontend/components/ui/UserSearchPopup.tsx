import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { ThemedModal } from "@/components/ThemedModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedTextInput } from "@/components/ThemedInput";
import { getUsers } from "@/api/users";
import { User } from "@/redux/types";

interface UserSearchPopupProps {
	visible: boolean;
	onClose: () => void;
	onSelectUser: (user: User) => void;
	title?: string;
	closeOnSelect?: boolean;
	excludeUserIds?: number[];
	actionLabel?: string;
	onActionPress?: (user: User) => void;
}

export function UserSearchPopup({
	visible,
	onClose,
	onSelectUser,
	title = "Find users",
	closeOnSelect = true,
	excludeUserIds = [],
	actionLabel,
	onActionPress,
}: UserSearchPopupProps) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!visible) {
			setQuery("");
			setResults([]);
			setError(null);
			setLoading(false);
		}
	}, [visible]);

	const loadUsers = useCallback(
		async (q: string) => {
			if (!visible) return;
			setLoading(true);
			setError(null);
			try {
				const trimmed = q.trim();
				const users = await getUsers(trimmed || undefined);
				const filtered = users.filter((u) => !excludeUserIds.includes(u.id));
				setResults(filtered);
			} catch (err) {
				setError("Failed to load users");
			} finally {
				setLoading(false);
			}
		},
		[excludeUserIds, visible]
	);

	useEffect(() => {
		if (!visible) return;
		const timer = setTimeout(() => {
			loadUsers(query);
		}, 250);
		return () => clearTimeout(timer);
	}, [query, loadUsers, visible]);

	const handleSelect = useCallback(
		(user: User) => {
			onSelectUser(user);
			if (closeOnSelect) onClose();
		},
		[closeOnSelect, onClose, onSelectUser]
	);

	const renderItem = useCallback(
		({ item }: { item: User }) => (
			<Pressable style={styles.userRow} onPress={() => handleSelect(item)}>
				<View style={styles.userInfo}>
					<ThemedText style={styles.username}>{item.username}</ThemedText>
					<ThemedText style={styles.email}>{item.email}</ThemedText>
				</View>
				{onActionPress ? (
					<Pressable style={styles.actionButton} onPress={() => onActionPress(item)}>
						<ThemedText style={styles.actionLabel}>{actionLabel ?? "Додати"}</ThemedText>
					</Pressable>
				) : null}
			</Pressable>
		),
		[actionLabel, handleSelect, onActionPress]
	);

	const keyExtractor = useCallback((item: User) => item.id.toString(), []);

	const content = useMemo(() => {
		if (loading) return <ActivityIndicator />;
		if (error) return <ThemedText style={styles.error}>{error}</ThemedText>;
		if (results.length === 0)
			return <ThemedText style={styles.placeholder}>No users found. Try another name.</ThemedText>;

		return <FlatList data={results} keyExtractor={keyExtractor} renderItem={renderItem} showsVerticalScrollIndicator />;
	}, [error, keyExtractor, loading, renderItem, results]);

	return (
		<ThemedModal visible={visible} onRequestClose={onClose} cardStyle={styles.card}>
			<ThemedView style={styles.headerRow}>
				<ThemedText style={styles.title}>{title}</ThemedText>
			</ThemedView>

			<View style={styles.fieldGroup}>
				<ThemedTextInput
					value={query}
					onChangeText={setQuery}
					placeholder="Search by username"
					autoCapitalize="none"
					autoCorrect={false}
				/>
			</View>

			<View style={styles.results}>{content}</View>
		</ThemedModal>
	);
}

const styles = StyleSheet.create({
	card: {
		gap: 12,
		minHeight: "50%",
	},
	headerRow: {
		alignItems: "center",
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
	},
	fieldGroup: {
		gap: 6,
	},
	results: {
		flex: 1,
		minHeight: 200,
		maxHeight: 400,
	},
	userRow: {
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderColor: "#e5e7eb",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	userInfo: {
		flex: 1,
		marginRight: 8,
	},
	username: {
		fontWeight: "700",
		fontSize: 15,
	},
	email: {
		fontSize: 13,
		color: "#555",
	},
	actionButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: "#007AFF",
	},
	actionLabel: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 13,
	},
	placeholder: {
		textAlign: "center",
		color: "#666",
		marginTop: 16,
	},
	error: {
		color: "#b00020",
		textAlign: "center",
		marginTop: 16,
	},
});
