import React from "react";
import { StyleSheet, Switch, StyleProp, ViewStyle } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

type ThemedSwitchProps = {
	value: boolean;
	onValueChange: (value: boolean) => void;
	label?: string;
	style?: StyleProp<ViewStyle>;
};

/**
 * A simple themed switch with optional label.
 */
export function ThemedSwitch({ value, onValueChange, label, style }: ThemedSwitchProps) {
	const trackColor = { false: "#007AFF", true: "#007AFF" };
	const thumbColor = value ? "#007AFF" : "#f4f3f4";

	return (
		<ThemedView style={[styles.container, style]}>
			{label ? <ThemedText style={styles.label}>{label}</ThemedText> : null}
			<Switch
				trackColor={trackColor}
				thumbColor={thumbColor}
				activeThumbColor="#fff"
				value={value}
				onValueChange={onValueChange}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	label: {
		fontSize: 16,
		marginRight: 12,
	},
});
