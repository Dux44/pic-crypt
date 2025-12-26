import axios from "axios";
import { API_URL } from "@/config";
import { getTokenFromLib } from "@/utils/lib";
import api from "./api";

export interface EncryptGifParams {
	imageUri: string;
	password: string;
	text: string;
}

export interface DecryptGifParams {
	imageUri: string;
	password: string;
}

export interface StoreImageParams {
	imageUri: string;
}

const isFormData = (data: unknown): boolean => {
	if (typeof FormData === "undefined") return false;
	if (data instanceof FormData) return true;
	return (data as any)?.constructor?.name === "FormData";
};

const stegoApi = axios.create({
	baseURL: API_URL,
});

stegoApi.interceptors.request.use(async (config) => {
	const token = await getTokenFromLib();
	config.headers = config.headers || {};
	if (token) config.headers.Authorization = `Bearer ${token}`;

	if (isFormData(config.data)) {
		delete (config.headers as any)["Content-Type"]; // let axios set boundary
	}

	return config;
});

const buildImageFormData = async (imageUri: string, password?: string, text?: string) => {
	const formData = new FormData();
	const candidateName = imageUri.split("/").pop() || "";
	const hasExt = /\.[a-zA-Z0-9]+$/.test(candidateName);
	const lower = candidateName.toLowerCase();
	const ext = lower.endsWith(".png")
		? ".png"
		: lower.endsWith(".gif")
		? ".gif"
		: lower.endsWith(".jpeg") || lower.endsWith(".jpg")
		? ".jpg"
		: ".jpg";
	const fileName = hasExt ? candidateName : `image${ext}`;
	const mime = ext === ".png" ? "image/png" : ext === ".gif" ? "image/gif" : "image/jpeg";
	const isWeb = typeof window !== "undefined" && typeof File !== "undefined";

	if (isWeb) {
		const res = await fetch(imageUri);
		const blob = await res.blob();
		const file = new File([blob], fileName, { type: mime || blob.type || "application/octet-stream" });
		formData.append("image", file);
	} else {
		formData.append("image", { uri: imageUri, name: fileName, type: mime } as any);
	}

	if (password !== undefined) {
		formData.append("password", password);
	}
	if (typeof text === "string") {
		formData.append("text", text);
	}
	return formData;
};

export const encryptGifAndStore = async ({ imageUri, password, text }: EncryptGifParams): Promise<string> => {
	const response = await stegoApi.post("/stego/encrypt/url", await buildImageFormData(imageUri, password, text), {
		headers: { "Content-Type": "multipart/form-data" },
	});

	return response.data.url;
};

export const decryptGif = async ({ imageUri, password }: DecryptGifParams): Promise<string> => {
	const response = await stegoApi.post("/stego/decrypt", await buildImageFormData(imageUri, password), {
		headers: { "Content-Type": "multipart/form-data" },
	});

	return response.data.message;
};

export const storeImage = async ({ imageUri }: StoreImageParams): Promise<string> => {
	const response = await stegoApi.post("/stego/store", await buildImageFormData(imageUri), {
		headers: { "Content-Type": "multipart/form-data" },
	});

	return response.data.url;
};
