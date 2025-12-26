import { store } from "@/redux/store";
import { createSocket } from "./socket";
import { getTokenFromLib, getUserIdFromToken } from "./lib";
import {
	addMessage as addMessageStore,
	removeMessage as removeMessageStore,
	updateMessage as updateMessageStore,
	clearChatMessages,
} from "@/redux/messagesSlice";
import {
	addMessage as addMessageApi,
	updateMessage as updateMessageApi,
	deleteMessage as deleteMessageApi,
} from "@/api/messages";
import {
	updateChat as updateChatStore,
	addChat as addChatStore,
	removeChat as removeChatStore,
} from "@/redux/chatsSlice";
import {
	createChat as createChatApi,
	updateChat as updateChatApi,
	deleteChat as deleteChatApi,
	deleteMember as deleteChatMemberApi,
	addMember as addChatMemberApi,
	getChatById,
} from "@/api/chats";
import { updateUser as updateUserStore, addUser as addUserStore } from "@/redux/usersSlice";
import { updateUser as updateUserApi, updateAvatar as updateUserAvatarApi } from "@/api/users";
import { Message } from "@/redux/types";

type EntityType = "user" | "chat" | "message";
type ActionType = "add" | "update" | "update-avatar" | "remove" | "remove-member" | "add-member";

export class RealtimeManager {
	private socket: any;
	private currentUserId: number | null = null;

	async init() {
		this.socket = await createSocket();

		// Capture the current user id for membership checks when processing chat events
		const headerUserId = this.socket?.connectHeaders?.userId;
		if (typeof headerUserId === "string") {
			this.currentUserId = Number(headerUserId);
		} else if (typeof headerUserId === "number") {
			this.currentUserId = headerUserId;
		}

		if (!this.currentUserId) {
			const token = await getTokenFromLib();
			this.currentUserId = token ? getUserIdFromToken(token) : null;
		}

		this.socket.onConnect = () => {
			console.log("WebSocket connected");

			// Subscribe to backend topics and route events into Redux
			this.socket.subscribe("/topic/user", (msg: any) => {
				try {
					const evt = JSON.parse(msg.body);
					this.handleEvent(evt.entity as EntityType, evt.action as ActionType, evt.data);
				} catch (e) {
					console.warn("Failed to parse user event", e);
				}
			});

			this.socket.subscribe("/topic/chat", (msg: any) => {
				try {
					const evt = JSON.parse(msg.body);
					this.handleEvent(evt.entity as EntityType, evt.action as ActionType, evt.data);
				} catch (e) {
					console.warn("Failed to parse chat event", e);
				}
			});

			this.socket.subscribe("/topic/message", (msg: any) => {
				try {
					const evt = JSON.parse(msg.body);
					this.handleEvent(evt.entity as EntityType, evt.action as ActionType, evt.data);
				} catch (e) {
					console.warn("Failed to parse message event", e);
				}
			});
		};

		this.socket.activate();
	}

	private async handleEvent(entity: EntityType, action: ActionType, data: any) {
		const dispatch = store.dispatch;

		switch (entity) {
			case "user": {
				if (action === "add") {
					dispatch(addUserStore(data));
				} else if (action === "update" || action === "update-avatar") {
					dispatch(updateUserStore(data));
				} else if (action === "remove") {
					// no explicit remove for users in current slice
				}
				break;
			}

			case "chat": {
				if (action === "add") {
					if (!this.isCurrentUserChatMember(data)) break;
					dispatch(addChatStore(data));
				} else if (action === "update") {
					const hasMembers = Array.isArray(data?.members);
					if (hasMembers && !this.isCurrentUserChatMember(data)) break;

					const state = store.getState();
					const exists = state.chats.byId?.[data?.id];
					if (exists) dispatch(updateChatStore(data));
					else dispatch(addChatStore(data));
				} else if (action === "remove") {
					// Keep server publish data minimal
					dispatch(removeChatStore(data.id));
					// No change to message clearing here
					dispatch(clearChatMessages(data.id));
				} else if (action === "remove-member" || action === "add-member") {
					const chatId = data?.id ?? data?.chatId;
					if (chatId != null) this.refreshChatFromServer(chatId);
				}
				break;
			}

			case "message": {
				if (action === "add") {
					dispatch(addMessageStore(data as Message));
				} else if (action === "update") {
					dispatch(updateMessageStore(data as Message));
				} else if (action === "remove") {
					dispatch(removeMessageStore({ chatId: data.chatId, messageId: data.id ?? data.messageId }));
				}
				break;
			}
		}
	}

	private isCurrentUserChatMember(chat: any): boolean {
		if (this.currentUserId == null) return true;
		if (!chat || !Array.isArray(chat.members)) return false;

		return this.isUserInMembers(chat.members, this.currentUserId);
	}

	private isUserInMembers(members: any[], userId: number | null): boolean {
		if (userId == null || !Array.isArray(members)) return false;

		return members.some((member: any) => {
			if (member == null) return false;
			if (typeof member === "number" || typeof member === "string") return Number(member) === userId;
			if (typeof member === "object") {
				if (member.memberId != null && Number(member.memberId) === userId) return true;
				if (member.id != null && Number(member.id) === userId) return true;
				if (member.userId != null && Number(member.userId) === userId) return true;
				if (member.user?.id != null && Number(member.user.id) === userId) return true;
			}
			return false;
		});
	}

	private async refreshChatFromServer(chatId: number) {
		try {
			const chat = await getChatById(chatId);
			if (!this.isCurrentUserChatMember(chat)) {
				store.dispatch(removeChatStore(chatId));
				store.dispatch(clearChatMessages(chatId));
				return;
			}
			const state = store.getState();
			const exists = state.chats.byId?.[chatId];
			if (exists) store.dispatch(updateChatStore(chat));
			else store.dispatch(addChatStore(chat));
		} catch (err: any) {
			const status = err?.response?.status;
			if (status === 404 || status === 403) {
				store.dispatch(removeChatStore(chatId));
				store.dispatch(clearChatMessages(chatId));
				return;
			}
			console.warn("Failed to refresh chat after member removal", err);
		}
	}

	async emit(entity: EntityType, action: ActionType, data: any) {
		if (!this.socket) return;

		let payload = data;
		try {
			switch (entity) {
				case "message": {
					if (action === "add") {
						payload = await addMessageApi(data);
					} else if (action === "update") {
						payload = await updateMessageApi(data.id, data);
					} else if (action === "remove") {
						await deleteMessageApi(data.id);
						payload = { chatId: data.chatId, id: data.id };
					}
					break;
				}

				case "chat": {
					if (action === "add") {
						payload = await createChatApi(data);
					} else if (action === "update") {
						payload = await updateChatApi(data.id, data);
					} else if (action === "remove") {
						await deleteChatApi(data.id);
						payload = { id: data.id };
					} else if (action === "remove-member") {
						if (data?.id == null || data?.memberId == null) {
							throw new Error("chat id and member id are required to remove a member");
						}
						await deleteChatMemberApi(data.id, data.memberId);
						payload = { id: data.id, memberId: data.memberId };
						this.refreshChatFromServer(data.id);
					} else if (action === "add-member") {
						if (data?.id == null || data?.memberId == null) {
							throw new Error("chat id and member id are required to add a member");
						}
						await addChatMemberApi(data.id, { memberId: data.memberId, role: data.role });
						payload = { id: data.id, memberId: data.memberId, role: data.role };
						this.refreshChatFromServer(data.id);
					}
					break;
				}

				case "user": {
					if (action === "update") {
						payload = await updateUserApi(data);
					} else if (action === "update-avatar") {
						payload = await updateUserAvatarApi((data as any)?.avatar ?? data);
					}
					break;
				}
			}
		} catch (err) {
			console.warn(`Failed to ${action} ${entity} before broadcast`, err);
			return;
		}

		this.socket.publish({
			destination: `/app/${entity}/${action}`,
			body: JSON.stringify(payload),
		});

		return payload;
	}

	disconnect() {
		if (this.socket) this.socket.deactivate();
	}
}

export const realtimeManager = new RealtimeManager();
