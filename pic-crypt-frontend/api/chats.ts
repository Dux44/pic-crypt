import { AvatarInput, Chat } from "@/redux/types";
import api from "./api";

export type ChatData = Partial<Chat>;
export type ChatMember = {
	memberId: number;
	role: string;
};

export const getChats = async (): Promise<Chat[]> => {
	const response = await api.get(`/chats/user`);
	return response.data;
};

export const getChat = async (friendId: number): Promise<Chat> => {
	const response = await api.get(`/chats/user/${friendId}`);
	return response.data;
};

export const getChatById = async (chatId: number): Promise<Chat> => {
	const response = await api.get(`/chats/${chatId}`);
	return response.data;
};

export const createChat = async (chat: ChatData): Promise<Chat> => {
	const response = await api.post(`/chats`, chat);
	return response.data;
};

export const updateChat = async (id: number, chat: ChatData): Promise<Chat> => {
	const response = await api.put(`/chats/${id}`, chat);
	return response.data;
};

export const updateChatAvatar = async (id: number, avatar: AvatarInput): Promise<Chat> => {
	const uri = typeof avatar === "string" ? avatar : avatar.uri;
	const fileName =
		typeof avatar === "string" ? uri.split("/").pop() : avatar.fileName || avatar.name || uri.split("/").pop();
	const mime =
		typeof avatar === "string"
			? uri.toLowerCase().endsWith(".png")
				? "image/png"
				: "image/jpeg"
			: avatar.mimeType || avatar.type || (uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");

	const formData = new FormData();
	formData.append("avatar", {
		uri,
		name: fileName || `chat-${id}-avatar.jpg`,
		type: mime,
	} as any);

	const response = await api.patch(`/chats/${id}/avatar`, formData);
	return response.data;
};

export const deleteChat = async (id: number) => {
	const response = await api.delete(`/chats/${id}`);
	return response.data;
};

export const addMember = async (chatId: number, member: ChatMember): Promise<Chat> => {
	const response = await api.post(`/chats/${chatId}/members`, member);
	return response.data;
};

export const deleteMember = async (chatId: number, memberId: number) => {
	const response = await api.delete(`/chats/${chatId}/members/${memberId}`);
	return response.data;
};
