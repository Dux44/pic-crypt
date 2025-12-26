import { Tabs } from "expo-router";
import React from "react";

import ChatIcon from "@/assets/images/chat.svg";
import ContactIcon from "@/assets/images/contact.svg";
import ProfileIcon from "@/assets/images/profile.svg";
import { HapticTab } from "@/components/HapticTab";
import { ThemedSvg } from "@/components/ThemedSvg";

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarButton: HapticTab,
			}}
		>
			<Tabs.Screen
				name="friends"
				options={{
					title: "",
					tabBarIcon: ({ color }) => <ThemedSvg IconComponent={ContactIcon} fill={color} />,
				}}
			/>
			<Tabs.Screen
				name="chats"
				options={{
					title: "",
					tabBarIcon: ({ color }) => <ThemedSvg IconComponent={ChatIcon} fill={color} />,
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "",
					tabBarIcon: ({ color }) => <ThemedSvg IconComponent={ProfileIcon} fill={color} />,
				}}
			/>
		</Tabs>
	);
}
