import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { SvgProps } from "react-native-svg";

type ThemedSvgProps = {
	IconComponent: React.FC<SvgProps>;
	width?: number;
	height?: number;
	lightColor?: string;
	darkColor?: string;
	fill?: string;
};

export function ThemedSvg({ IconComponent, width = 28, height = 28, lightColor, darkColor, fill }: ThemedSvgProps) {
	const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

	return <IconComponent width={width} height={height} fill={fill ? fill : color} />;
}
