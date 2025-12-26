import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "./types";

type UsersState = {
	byId: Record<number, User>;
};

const initialState: UsersState = {
	byId: {},
};

const usersSlice = createSlice({
	name: "users",
	initialState,
	reducers: {
		upsertUsers(state, action: PayloadAction<User[]>) {
			action.payload.forEach((user) => {
				state.byId[user.id] = user;
			});
		},
		updateUser(state, action: PayloadAction<User>) {
			state.byId[action.payload.id] = {
				...state.byId[action.payload.id],
				...action.payload,
			};
		},
		addUser(state, action: PayloadAction<User>) {
			state.byId[action.payload.id] = action.payload;
		},
	},
});

export const { upsertUsers, updateUser, addUser } = usersSlice.actions;
export default usersSlice.reducer;
