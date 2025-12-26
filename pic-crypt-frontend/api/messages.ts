import { Message } from "@/redux/types";
import api from "./api";

export type MessageData = {
	chatId: number;
	senderId: number;
	content?: string;
	mediaUrl?: string;

	viewCount?: number;
	expire_at?: number;
	selfDestructType?: string;
};

export const getMessages = async (chatId: number): Promise<Message[]> => {
	const response = await api.get(`/messages/${chatId}`);
	return response.data;
};

export const addMessage = async (message: MessageData): Promise<Message> => {
	const response = await api.post(`/messages`, message);
	return response.data;
};

export const updateMessage = async (id: number, message: MessageData): Promise<Message> => {
	const response = await api.put(`/messages/${id}`, message);
	return response.data;
};

export const deleteMessage = async (id: number) => {
	const response = await api.delete(`/messages/${id}`);
	return response.data;
};
