import api from "./api";
import { User } from "@/redux/types";

export const getFriends = async (): Promise<User[]> => {
	const response = await api.get(`/friends`);
	return response.data;
};

export const addFriend = async (userId: number) => {
	const response = await api.post(`/friends`, { friendId: userId });
	return response.data;
};

export const deleteFriend = async (userId: number) => {
	const response = await api.delete(`/friends/${userId}`);
	return response.data;
};
