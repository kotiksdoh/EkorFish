import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { AnimatedStackedSheet } from "@/features/shared/ui/AnimatedStackedSheet";
import { useAppTheme } from "@/hooks/use-theme-color";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PushItem = {
  title: string;
  body: string;
  sentAt: string;
};

interface PushNotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  pushes: PushItem[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const formatGroupLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Сегодня";
  if (isYesterday) return "Вчера";

  return date.toLocaleDateString("ru-RU");
};

const groupPushes = (items: PushItem[]) => {
  const groups: Record<string, PushItem[]> = {};

  items.forEach((item) => {
    const key = formatGroupLabel(item.sentAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return Object.entries(groups).map(([dateLabel, pushes]) => ({
    dateLabel,
    pushes,
  }));
};

export const PushNotificationsModal: React.FC<PushNotificationsModalProps> = ({
  visible,
  onClose,
  pushes,
  isLoading,
  hasMore,
  onLoadMore,
}) => {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [selectedPush, setSelectedPush] = useState<PushItem | null>(null);
  const groupedData = useMemo(() => groupPushes(pushes), [pushes]);

  useEffect(() => {
    if (!visible) {
      setSelectedPush(null);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container} lightColor="#EBEDF0" darkColor="#040508">
        <ModalHeader
          title="Уведомления"
          showBackButton
          onBackPress={onClose}
        />

        {isLoading && pushes.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={isDark ? "#4C94FF" : "#203686"} />
          </View>
        ) : (
          <FlatList
            data={groupedData}
            keyExtractor={(item) => item.dateLabel}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: Math.max(insets.bottom, 24) + 16 },
            ]}
            onEndReachedThreshold={0.3}
            onEndReached={() => {
              if (!isLoading && hasMore) {
                onLoadMore();
              }
            }}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText} lightColor="#80818B" darkColor="#FBFCFF80">
                Уведомлений пока нет
              </ThemedText>
            }
            ListFooterComponent={
              isLoading && pushes.length > 0 ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={isDark ? "#4C94FF" : "#203686"} />
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={styles.groupContainer}>
                <ThemedView
                  style={styles.groupCard}
                  lightColor="#FFFFFF"
                  darkColor="#151516"
                >
                  <ThemedText
                    style={styles.groupTitleInside}
                    lightColor="#80818B"
                    darkColor="#FBFCFF80"
                  >
                    {item.dateLabel}
                  </ThemedText>
                  <View
                    style={[
                      styles.itemDivider,
                      styles.groupHeaderDivider,
                      { backgroundColor: isDark ? "#252527" : "#F0F3F7" },
                    ]}
                  />
                  {item.pushes.map((push, idx) => (
                    <View key={`${push.sentAt}-${idx}`}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSelectedPush(push)}
                        style={styles.pushItemTouchable}
                      >
                        <View style={styles.rowTitle}>
                          <ThemedText style={styles.pushTitle} numberOfLines={1}>
                            {push.title}
                          </ThemedText>
                          <ArrowIconRight />
                        </View>
                        <ThemedText
                          style={styles.pushBody}
                          lightColor="#80818B"
                          darkColor="#FBFCFF80"
                          numberOfLines={2}
                        >
                          {push.body}
                        </ThemedText>
                      </TouchableOpacity>
                      {idx !== item.pushes.length - 1 ? (
                        <View
                          style={[
                            styles.itemDivider,
                            { backgroundColor: isDark ? "#252527" : "#F0F3F7" },
                          ]}
                        />
                      ) : null}
                    </View>
                  ))}
                </ThemedView>
              </View>
            )}
          />
        )}

        <AnimatedStackedSheet
          visible={Boolean(selectedPush)}
          onClose={() => setSelectedPush(null)}
          showBackdrop
        >
          <ThemedText
            style={styles.sheetTitle}
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
          >
            {selectedPush?.title || ""}
          </ThemedText>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetScrollContent}
            nestedScrollEnabled
          >
            <ThemedText style={styles.sheetBody} lightColor="#1B1B1C" darkColor="#FBFCFF">
              {selectedPush?.body || ""}
            </ThemedText>
          </ScrollView>
        </AnimatedStackedSheet>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    // paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  groupContainer: {
    gap: 8,
  },
  groupTitleInside: {
    fontSize: 14,
    fontWeight: "500",
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  groupCard: {
    borderRadius: 16,
    marginTop: 4,
    overflow: "hidden",
  },
  pushItemTouchable: {
    padding: 16,
  },
  itemDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  groupHeaderDivider: {
    marginHorizontal: 0,
  },
  rowTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  pushTitle: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  pushBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 48,
    fontSize: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "left",
  },
  sheetScrollContent: {
    paddingBottom: 8,
  },
  sheetBody: {
    fontSize: 16,
    lineHeight: 22,
    paddingBottom: 16,
  },
});

