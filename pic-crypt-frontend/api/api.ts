import { API_URL } from "@/config";
import { getTokenFromLib, removeTokenFromLib } from "@/utils/lib";
import axios from "axios";

const isFormData = (data: unknown): boolean => {
	if (typeof FormData === "undefined") return false;
	if (data instanceof FormData) return true;
	return (data as any)?.constructor?.name === "FormData";
};

const api = axios.create({
	baseURL: API_URL,
	headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
	const token = await getTokenFromLib();
	if (token) config.headers.Authorization = `Bearer ${token}`;

	if (isFormData(config.data)) {
		config.headers = config.headers || {};
		delete config.headers["Content-Type"];
	}

	return config;
});

api.interceptors.response.use(
	(res) => res,
	async (error) => {
		if (error.response?.status === 401) {
			await removeTokenFromLib();
		}
		return Promise.reject(error);
	}
);

export default api;
