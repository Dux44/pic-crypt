export type User = {
	id: number;
	username: string;
	email: string;
	avatarUrl: string;
	bio?: string;
};

export type ChatMember = User & {
	chatId: number;
	memberId: number;
	role: string;
};

export type Chat = {
	id: number;
	title?: string;
	isGroup: boolean;
	avatarUrl: string;
	members: ChatMember[];
	lastMessageId?: number;

	description?: string;
	allowInvites: boolean;
};

export type Message = {
	id?: number;
	chatId: number;
	senderId: number;
	content: string;
	mediaUrl?: string;
	createdAt: Date;

	viewCount?: number;
	expire_at?: number;
	selfDestructType?: string;
};

export type AvatarInput =
	| string
	| {
			uri: string;
			fileName?: string | null;
			mimeType?: string | null;
			type?: string | null;
			name?: string | null;
	  };
