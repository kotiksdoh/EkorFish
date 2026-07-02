import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROBOT_IMAGE = require("@/assets/images/ai-robot.png");

export const AiAssistantScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView
      lightColor="#EBEDF0"
      darkColor="#040508"
      style={styles.screen}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
      >
        <Image
          source={ROBOT_IMAGE}
          style={styles.robotImage}
          contentFit="contain"
        />

        <ThemedText
          lightColor="#1B1B1C"
          darkColor="#FBFCFF"
          style={styles.title}
        >
          AI-помощник
        </ThemedText>

        <ThemedText
          lightColor="#80818B"
          darkColor="#FBFCFF80"
          style={styles.status}
        >
          Страница в разработке
        </ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  robotImage: {
    width: 180,
    height: 180,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
    textAlign: "center",
  },
  status: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
  },
});
