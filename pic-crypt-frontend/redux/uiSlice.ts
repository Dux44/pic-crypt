import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UIState = {
	currentChatId: number | null;
};

const initialState: UIState = { currentChatId: null };

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		openChat(state, action: PayloadAction<number>) {
			state.currentChatId = action.payload;
		},
	},
});

export const { openChat } = uiSlice.actions;
export default uiSlice.reducer;
