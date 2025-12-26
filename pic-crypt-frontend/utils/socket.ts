
import { Client } from "@stomp/stompjs";
import { Platform } from "react-native";
import SockJS from "sockjs-client";
import { getTokenFromLib, getUserIdFromToken } from "./lib";
export const SOCKET_HTTP_URL = "http://localhost:8080/ws";      // SockJS
export const SOCKET_WS_URL   = "ws://localhost:8080/ws/websocket"; // Native

export const createSocket = async () => {
	const token = await getTokenFromLib();
	const userId = token ? getUserIdFromToken(token) : undefined;
	const isWeb = Platform.OS === "web";

	const client = new Client({
		reconnectDelay: 5000,
		debug: (msg) => console.log("[WS]", msg),

		connectHeaders: {
			Authorization: `Bearer ${token}`,
			userId: String(userId),
		},

		...(isWeb
			? {
					// ✅ SockJS MUST use http/https
					webSocketFactory: () => new SockJS(SOCKET_HTTP_URL),
			  }
			: {
					// ✅ Native uses real WebSocket
					brokerURL: SOCKET_WS_URL,
			  }),
	});

	return client;
};
