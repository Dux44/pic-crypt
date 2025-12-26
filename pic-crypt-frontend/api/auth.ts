import api from "./api";

type LoginData = {
	username: string;
	password: string;
};

type RegisterData = {
	username: string;
	email: string;
	password: string;
};

type AuthResponse = {
	token: string;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
	const response = await api.post("/auth/login", data);
	return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
	const response = await api.post("/auth/register", data);
	return response.data;
};
