import { WarningIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { runAppBootstrap } from "@/features/auth/authSlice";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

export function HomeBootstrapBanner() {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const bootstrapStatus = useAppSelector((state) => state.auth.bootstrapStatus);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await dispatch(runAppBootstrap({ skipTimeout: true })).unwrap();
    } catch {
      // bootstrapStatus обновится в slice
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, isRefreshing]);

  if (bootstrapStatus === "ready" || bootstrapStatus === "idle") {
    return null;
  }

  return (
    <ThemedView
      lightColor="#E1F0FF"
      darkColor="#212945"
      style={styles.container}
    >
      <View style={styles.topRow}>
        <WarningIcon
          stroke={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
          fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
        />

        <View style={styles.textBlock}>
          <ThemedText
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
            style={styles.title}
          >
            Нет подключения к серверу
          </ThemedText>
          <ThemedText
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
            style={styles.subtitle}
          >
            Проверьте интернет или отключите VPN, затем обновите данные
          </ThemedText>
        </View>
      </View>

      <PrimaryButton
        title="Обновить"
        onPress={handleRefresh}
        variant="primary"
        size="md"
        loading={isRefreshing}
        fullWidth
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: "Montserrat-Medium",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 18.2,
  },
  subtitle: {
    fontFamily: "Montserrat-Medium",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 18.2,
    opacity: 0.75,
  },
});
