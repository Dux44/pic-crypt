import { configureStore } from "@reduxjs/toolkit";
import chatsReducer from "./chatsSlice";
import friendsReducer from "./friendsSlice";
import messagesReducer from "./messagesSlice";
import uiReducer from "./uiSlice";
import usersReducer from "./usersSlice";

export const store = configureStore({
	reducer: {
		users: usersReducer,
		chats: chatsReducer,
		messages: messagesReducer,
		ui: uiReducer,
		friends: friendsReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
