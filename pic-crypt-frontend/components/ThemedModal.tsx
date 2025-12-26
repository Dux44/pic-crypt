import React from "react";
import { Modal, Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "react-native";

type ThemedModalProps = {
	visible: boolean;
	onRequestClose: () => void;
	children: React.ReactNode;
	animationType?: "none" | "slide" | "fade";
	cardStyle?: StyleProp<ViewStyle>;
	contentStyle?: StyleProp<ViewStyle>;
	backdropOpacity?: number; // 0-1; defaults depend on theme
	transparentCard?: boolean; // if true, card has no background
};

export function ThemedModal({
	visible,
	onRequestClose,
	children,
	animationType = "fade",
	cardStyle,
	contentStyle,
	backdropOpacity,
	transparentCard = false,
}: ThemedModalProps) {
	const scheme = useColorScheme() ?? "light";
	const background = useThemeColor({}, "background");
	const effectiveBackdropOpacity = backdropOpacity ?? (scheme === "dark" ? 0.6 : 0.3);

	return (
		<Modal visible={visible} transparent animationType={animationType} onRequestClose={onRequestClose}>
			<Pressable
				style={[styles.backdrop, { backgroundColor: `rgba(0,0,0,${effectiveBackdropOpacity})` }, contentStyle]}
				onPress={onRequestClose}
			>
				<Pressable
					style={[styles.card, transparentCard ? null : { backgroundColor: background }, cardStyle]}
					onPress={(e) => e.stopPropagation()}
				>
					{children}
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		justifyContent: "flex-end",
	},
	card: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		padding: 16,
		minHeight: "35%",
	},
});
