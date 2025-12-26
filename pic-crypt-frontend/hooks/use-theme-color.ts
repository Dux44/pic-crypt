import { useTheme } from "@react-navigation/native";
import { useColorScheme } from "react-native";

export function useThemeColor(props: { light?: string; dark?: string }, colorName: "text" | "background") {
	const navigationTheme = useTheme();
	const system = useColorScheme() ?? "light";

	if (system === "dark" && props.dark) return props.dark;
	if (system === "light" && props.light) return props.light;

	return navigationTheme.colors[colorName];
}
