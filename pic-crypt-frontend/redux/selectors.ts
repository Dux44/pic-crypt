import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./store";

export const selectUser = (state: RootState, userId: number) => state.users.byId[userId];

export const selectFriend = (state: RootState, friendId: number) => state.friends.byId[friendId];

export const selectAllFriends = (state: RootState) => state.friends.allIds.map((id) => state.friends.byId[id]);

export const selectAllFriendUsers = createSelector(
	(state: RootState) => state.friends.byId,
	(state: RootState) => state.friends.allIds,
	(friendsById, allIds) =>
		allIds.map((id) => friendsById[id]).filter((friend): friend is NonNullable<typeof friend> => Boolean(friend))
);

export const selectChat = (state: RootState, chatId: number) => state.chats.byId[chatId];

export const selectAllChats = (state: RootState) => state.chats.allIds.map((id) => state.chats.byId[id]);

export const selectAllChatsSorted = createSelector(
	(state: RootState) => state.chats.byId,
	(state: RootState) => state.chats.allIds,
	(state: RootState) => state.messages.byChatId,
	(chatsById, allIds, messagesByChatId) => {
		const chats = allIds.map((id) => chatsById[id]);

		return chats.sort((a, b) => {
			const aMessages = a.lastMessageId ? messagesByChatId[a.id] || [] : [];
			const bMessages = b.lastMessageId ? messagesByChatId[b.id] || [] : [];

			const aMsg = aMessages.find((m) => m.id === a.lastMessageId);
			const bMsg = bMessages.find((m) => m.id === b.lastMessageId);

			const aTime = aMsg ? new Date(aMsg.createdAt).getTime() : 0;
			const bTime = bMsg ? new Date(bMsg.createdAt).getTime() : 0;

			return bTime - aTime;
		});
	}
);

export const selectMessages = (state: RootState, chatId: number) => state.messages.byChatId[chatId] || [];

export const selectCurrentChatId = (state: RootState) => state.ui.currentChatId;
