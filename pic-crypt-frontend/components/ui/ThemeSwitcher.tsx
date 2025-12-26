import { useAuth } from "@/utils/AuthContext";
import { StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { ThemedSwitch } from "../ThemedSwitch";

export function ThemeSwitcher() {
	const { colorTheme, updateColorTheme } = useAuth();

	const isDark = colorTheme === "dark";

	const toggleTheme = () => {
		updateColorTheme(isDark ? "light" : "dark");
	};

	return (
		<ThemedView style={styles.container}>
			<ThemedText style={styles.label}>{isDark ? "Темна тема" : "Світла тема"}</ThemedText>
			<ThemedSwitch value={isDark} onValueChange={toggleTheme} />
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 12,
	},
	label: {
		fontSize: 16,
	},
});
