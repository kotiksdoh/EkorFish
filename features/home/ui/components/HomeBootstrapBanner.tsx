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
      lightColor="#F2F4F7"
      darkColor="#202022"
      style={styles.container}
    >
      <View style={styles.topRow}>
        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#151516"
          style={styles.iconWrap}
        >
          <WarningIcon
            stroke={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
            fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
          />
        </ThemedView>

        <View style={styles.textBlock}>
          <ThemedText style={styles.title}>
            Нет подключения к серверу
          </ThemedText>
          <ThemedText
            lightColor="#80818B"
            darkColor="#FBFCFF80"
            style={styles.subtitle}
          >
            Проверьте интернет или отключите VPN, затем обновите данные
          </ThemedText>
        </View>
      </View>

      <PrimaryButton
        title="Обновить"
        onPress={handleRefresh}
        variant="third"
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
    padding: 12,
    borderRadius: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    padding: 10,
    borderRadius: 8,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
});
