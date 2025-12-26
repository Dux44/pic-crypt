import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

export type ThemedTextInputProps = TextInputProps & {
	lightColor?: string;
	darkColor?: string;
	borderLightColor?: string;
	borderDarkColor?: string;
	backgroundLightColor?: string;
	backgroundDarkColor?: string;
};

export function ThemedTextInput({
	style,
	lightColor,
	darkColor,
	borderLightColor,
	borderDarkColor,
	backgroundLightColor,
	backgroundDarkColor,
	...rest
}: ThemedTextInputProps) {
	const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
	const borderColor = useThemeColor({ light: borderLightColor, dark: borderDarkColor }, "border");
	const backgroundColor = useThemeColor({ light: backgroundLightColor, dark: backgroundDarkColor }, "card");

	return (
		<TextInput
			style={[styles.input, { color, borderColor, backgroundColor }, style]}
			placeholderTextColor={color + "88"}
			{...rest}
		/>
	);
}

const styles = StyleSheet.create({
	input: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 12,
		borderWidth: 1,
		fontSize: 16,
	},
});
