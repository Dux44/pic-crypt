import { AvatarInput, User } from "@/redux/types";
import api from "./api";

export type UserData = Partial<User>;

export const getUsers = async (username?: string): Promise<User[]> => {
	const response = await api.get(`/users`, {
		params: username ? { username } : undefined,
	});
	return response.data;
};

export const getUser = async (): Promise<User> => {
	const response = await api.get(`/users/me`);
	return response.data;
};

export const updateUser = async (user: UserData): Promise<User> => {
	const response = await api.patch(`/users/me`, user);
	return response.data;
};

const buildAvatarFormData = async (avatar: AvatarInput): Promise<FormData> => {
	const uri = typeof avatar === "string" ? avatar : avatar.uri;
	const candidateName =
		typeof avatar === "string"
			? uri.split("/").pop() ?? ""
			: avatar.fileName || avatar.name || uri.split("/").pop() || "";
	const inputMime =
		typeof avatar === "string"
			? uri.toLowerCase().endsWith(".png")
				? "image/png"
				: uri.toLowerCase().endsWith(".gif")
				? "image/gif"
				: "image/jpeg"
			: avatar.mimeType || avatar.type;
	const extFromMime = inputMime?.includes("png")
		? ".png"
		: inputMime?.includes("gif")
		? ".gif"
		: inputMime?.includes("jpeg") || inputMime?.includes("jpg")
		? ".jpg"
		: ".jpg";
	const hasExtension = /\.[a-zA-Z0-9]+$/.test(candidateName);
	const safeFileName = hasExtension ? candidateName : `user-avatar${extFromMime}`;
	const mime = inputMime || (safeFileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");

	const formData = new FormData();
	const isWeb = typeof window !== "undefined" && typeof File !== "undefined";

	if (isWeb) {
		const res = await fetch(uri);
		const blob = await res.blob();
		const file = new File([blob], safeFileName, {
			type: mime || blob.type || "application/octet-stream",
		});
		formData.append("avatar", file);
	} else {
		formData.append("avatar", {
			uri,
			name: safeFileName,
			type: mime || "application/octet-stream",
		} as any);
	}

	return formData;
};

export const updateAvatar = async (avatar: AvatarInput): Promise<User> => {
	const formData = await buildAvatarFormData(avatar);
	const response = await api.patch(`/users/me/avatar`, formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return response.data;
};

export const deleteUser = async (): Promise<void> => {
	const response = await api.delete(`/users/me`);
	return response.data;
};
