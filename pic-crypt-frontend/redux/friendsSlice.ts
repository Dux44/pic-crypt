import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "./types";

export type Friend = User;

type FriendsState = {
	byId: Record<number, Friend>;
	allIds: number[];
};

const initialState: FriendsState = {
	byId: {},
	allIds: [],
};

const friendsSlice = createSlice({
	name: "friends",
	initialState,
	reducers: {
		addFriend(state, action: PayloadAction<Friend>) {
			const friend = action.payload;
			state.byId[friend.id] = friend;
			if (!state.allIds.includes(friend.id)) state.allIds.push(friend.id);
		},
		removeFriend(state, action: PayloadAction<number>) {
			const id = action.payload;
			delete state.byId[id];
			state.allIds = state.allIds.filter((fid) => fid !== id);
		},
		upsertFriends(state, action: PayloadAction<Friend[]>) {
			action.payload.forEach((friend) => {
				state.byId[friend.id] = friend;
				if (!state.allIds.includes(friend.id)) state.allIds.push(friend.id);
			});
		},
	},
});

export const { addFriend, removeFriend, upsertFriends } = friendsSlice.actions;
export default friendsSlice.reducer;
