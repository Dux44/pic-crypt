import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message } from "./types";

type MessagesState = {
	byChatId: Record<number, Message[]>;
};
const initialState: MessagesState = {
	byChatId: {},
};

const messagesSlice = createSlice({
	name: "messages",
	initialState,
	reducers: {
		setMessages(state, action: PayloadAction<{ chatId: number; messages: Message[] }>) {
			state.byChatId[action.payload.chatId] = action.payload.messages;
		},
		addMessage(state, action: PayloadAction<Message>) {
			const msg = action.payload;
			if (!state.byChatId[msg.chatId]) state.byChatId[msg.chatId] = [];
			state.byChatId[msg.chatId].push(msg);
		},
		updateMessage(state, action: PayloadAction<Message>) {
			const msg = action.payload;
			const list = state.byChatId[msg.chatId];
			if (!list) return;
			const idx = list.findIndex((m) => m.id === msg.id);
			if (idx !== -1) {
				list[idx] = { ...list[idx], ...msg };
			}
		},
		removeMessage(state, action: PayloadAction<{ chatId: number; messageId: number }>) {
			const { chatId, messageId } = action.payload;
			if (state.byChatId[chatId]) {
				state.byChatId[chatId] = state.byChatId[chatId].filter((msg) => msg.id !== messageId);
			}
		},
		clearChatMessages(state, action: PayloadAction<number>) {
			delete state.byChatId[action.payload];
		},
	},
});

export const { setMessages, addMessage, updateMessage, removeMessage, clearChatMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
