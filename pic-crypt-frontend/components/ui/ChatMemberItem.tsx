import { Image, Pressable, StyleSheet } from "react-native";
import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import { ChatMember } from "@/redux/types";
import { buildAbsoluteUrl } from "@/utils/lib";

type ChatMemberProps = {
	isGroup: boolean;
	member: ChatMember;
	onRemove: (chatId: number, memberId: number, allowSelf?: boolean) => void;
	canRemove: boolean;
};

const ChatMemberItem = ({ isGroup, member, onRemove, canRemove }: ChatMemberProps) => {
	let avatarUrl = buildAbsoluteUrl(member.avatarUrl);

	return (
		<ThemedView style={styles.memberItem}>
			<Image source={{ uri: avatarUrl }} style={styles.memberAvatar} />
			<ThemedText style={styles.memberUsername}>{member.username}</ThemedText>
			<ThemedText> ({member.role === "OWNER" ? "Власник" : "Учасник"})</ThemedText>
			{canRemove && (
				<Pressable onPress={() => onRemove(member.chatId, member.memberId)}>
					<ThemedText style={styles.removeMemberButton}>Видалити</ThemedText>
				</Pressable>
			)}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	memberItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
	},
	memberAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 12,
	},
	memberUsername: {
		marginLeft: 10,
		fontWeight: "bold",
	},
	removeMemberButton: {
		marginLeft: 10,
		color: "red",
	},
});

export default ChatMemberItem;
