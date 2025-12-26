import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { addMessage, setMessages } from "./messagesSlice";
import { Chat } from "./types";

type ChatsState = {
	byId: Record<number, Chat>;
	allIds: number[];
};

const initialState: ChatsState = {
	byId: {},
	allIds: [],
};

const chatsSlice = createSlice({
	name: "chats",
	initialState,
	reducers: {
		upsertChats(state, action: PayloadAction<Chat[]>) {
			action.payload.forEach((chat) => {
				state.byId[chat.id] = chat;
				if (!state.allIds.includes(chat.id)) state.allIds.push(chat.id);
			});
		},
		updateChat(state, action: PayloadAction<Chat>) {
			const chat = action.payload;
			state.byId[chat.id] = { ...state.byId[chat.id], ...chat };
		},
		addChat(state, action: PayloadAction<Chat>) {
			const chat = action.payload;
			state.byId[chat.id] = chat;
			if (!state.allIds.includes(chat.id)) state.allIds.push(chat.id);
		},
		removeChat(state, action: PayloadAction<number>) {
			const id = action.payload;
			delete state.byId[id];
			state.allIds = state.allIds.filter((cid) => cid !== id);
		},
		addMember(state, action: PayloadAction<{ chatId: number; userId: number }>) {
			const { chatId, userId } = action.payload;
			const chat = state.byId[chatId];
			if (!chat) return;
			if (!chat.members.includes(userId)) {
				chat.members = [...chat.members, userId];
			}
		},
		removeMember(state, action: PayloadAction<{ chatId: number; userId: number }>) {
			const { chatId, userId } = action.payload;
			const chat = state.byId[chatId];
			if (!chat) return;
			chat.members = chat.members.filter((id) => id !== userId);
		},
	},
	extraReducers: (builder) => {
		builder.addCase(addMessage, (state, action) => {
			const { chatId, id } = action.payload;
			if (state.byId[chatId]) {
				state.byId[chatId].lastMessageId = id;
			}
		});

		builder.addCase(setMessages, (state, action) => {
			const { chatId, messages } = action.payload;
			if (!state.byId[chatId] || messages.length === 0) return;

			const last = messages.reduce((latest, msg) => {
				if (!latest) return msg;
				const latestTime = new Date(latest.createdAt).getTime();
				const msgTime = new Date(msg.createdAt).getTime();
				return msgTime >= latestTime ? msg : latest;
			}, messages[0]);

			if (last?.id !== undefined) {
				state.byId[chatId].lastMessageId = last.id;
			}
		});
	},
});

export const { upsertChats, updateChat, addChat, removeChat, addMember, removeMember } = chatsSlice.actions;
export default chatsSlice.reducer;
