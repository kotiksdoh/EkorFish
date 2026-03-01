import { Button, StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabTwoScreen() {
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      // Опционально: перенаправление на экран авторизации
    } catch (error) {
      console.error("Ошибка при очистке AsyncStorage:", error);
    }
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          TODO
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.contentContainer}>
        <Button title="Выход" onPress={handleLogout} />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  contentContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
});
