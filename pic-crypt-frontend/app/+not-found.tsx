import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { router, Stack } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: "Oops! Not Found" }} />
			<ThemedView style={styles.container}>
				<Pressable onPress={() => router.replace("/auth/login")}>
					<ThemedText style={styles.button}>Continue to login screen</ThemedText>
				</Pressable>
			</ThemedView>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},

	button: {
		fontSize: 20,
		textDecorationLine: "underline",
		color: "#3399ff",
	},
});
