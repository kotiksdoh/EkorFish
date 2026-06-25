// features/home/components/CompanySelectModal.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { getMyOrders } from "@/features/catalog/catalogSlice";
import OrdersCard from "@/features/home/ui/components/Orders/OrdersCard";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  LayoutChangeEvent,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface MyOrdersProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = "active" | "completed";
const ORDERS_PAGE_SIZE = 10;

export const MyOrdersModal: React.FC<MyOrdersProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";

  const [selectedTab, setSelectedTab] = useState<TabType>("active");
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const [tabAnim] = useState(new Animated.Value(0));
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [initializedTabs, setInitializedTabs] = useState<Record<TabType, boolean>>({
    active: false,
    completed: false,
  });
  const [isTabLoading, setIsTabLoading] = useState<Record<TabType, boolean>>({
    active: false,
    completed: false,
  });
  const [isLoadingMore, setIsLoadingMore] = useState<Record<TabType, boolean>>({
    active: false,
    completed: false,
  });
  const offsetsRef = useRef<Record<TabType, number>>({ active: 0, completed: 0 });
  const hasMoreRef = useRef<Record<TabType, boolean>>({ active: true, completed: true });
  const inFlightRef = useRef<Record<TabType, boolean>>({ active: false, completed: false });

  const dispatch = useAppDispatch();

  const fetchOrders = useCallback(async (tab: TabType, isLoadMore = false) => {
      if (inFlightRef.current[tab]) {
        console.log(`[Orders] Already fetching ${tab}`, isLoadMore);
        return;
      }
      if (isLoadMore && !hasMoreRef.current[tab]) {
        console.log(`[Orders] No more items for ${tab}`);
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log(`[Orders] No token found`);
        return;
      }

      inFlightRef.current[tab] = true;
      const isActive = tab === "active";
      const offset = isLoadMore ? offsetsRef.current[tab] : 0;

      console.log(`[Orders] Fetching ${tab}:`, { isLoadMore, offset, isActive });

      if (isLoadMore) {
        setIsLoadingMore((prev) => ({ ...prev, [tab]: true }));
      } else {
        setIsTabLoading((prev) => ({ ...prev, [tab]: true }));
      }

      try {
        const payload = await dispatch(
          getMyOrders({
            offset,
            count: ORDERS_PAGE_SIZE,
            isActive,
          })
        ).unwrap();

        const nextItems = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

        console.log(`[Orders] Got ${nextItems.length} items for ${tab}`);

        const setData = tab === "active" ? setActiveOrders : setCompletedOrders;
        setData((prev) => {
          const newData = isLoadMore ? [...prev, ...nextItems] : nextItems;
          console.log(`[Orders] Setting ${tab} data, count:`, newData.length);
          return newData;
        });

        offsetsRef.current[tab] = isLoadMore
          ? offset + nextItems.length
          : nextItems.length;
        hasMoreRef.current[tab] = nextItems.length === ORDERS_PAGE_SIZE;
        setInitializedTabs((prev) => ({ ...prev, [tab]: true }));
      } catch (error) {
        console.error(`[Orders] Error fetching ${tab}:`, error);
      } finally {
        inFlightRef.current[tab] = false;
        setIsTabLoading((prev) => ({ ...prev, [tab]: false }));
        setIsLoadingMore((prev) => ({ ...prev, [tab]: false }));
      }
    }, [dispatch]);

  useEffect(() => {
    if (!visible) return;
    
    // Сбрасываем состояние при открытии модалки
    setSelectedTab("active");
    tabAnim.setValue(0);
    setActiveOrders([]);
    setCompletedOrders([]);
    setInitializedTabs({ active: false, completed: false });
    setIsTabLoading({ active: true, completed: false });
    setIsLoadingMore({ active: false, completed: false });
    offsetsRef.current = { active: 0, completed: 0 };
    hasMoreRef.current = { active: true, completed: true };
    inFlightRef.current = { active: false, completed: false };
    
    // Загружаем активные заказы
    fetchOrders("active", false);
  }, [visible]);

  const handleTabChange = (tab: TabType) => {
    if (tab === selectedTab) return;
    Animated.spring(tabAnim, {
      toValue: tab === "active" ? 0 : 1,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
    setSelectedTab(tab);
    const shouldFetch = !initializedTabs[tab];
    if (shouldFetch) {
      fetchOrders(tab, false);
    }
  };

  const handleTabContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    const cleanWidth = width - 6;
    const tabWidth = cleanWidth / 2;
    setTabContainerWidth(tabWidth);
  };

  const indicatorPosition = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabContainerWidth] as number[],
  });

  const renderEmptyState = (tab: TabType) => (
    <View style={styles.emptyContainer}>
      <ThemedText
        style={styles.emptyText}
        lightColor="#80818B"
        darkColor="#FBFCFF80"
      >
        {tab === "active" 
          ? "У вас нет активных заказов" 
          : "У вас нет завершенных заказов"}
      </ThemedText>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={isDark ? "#FBFCFF" : "#203686"} />
      <ThemedText
        style={styles.loadingText}
        lightColor="#80818B"
        darkColor="#FBFCFF80"
      >
        Загрузка заказов...
      </ThemedText>
    </View>
  );

  const renderOrdersList = (data: any[], tab: TabType) => (
    <FlatList
      data={data}
      keyExtractor={(item, index) => `${tab}-${item.id}-${index}`}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <OrdersCard
          order={item}
          fullWidth={true}
          onReorderSuccess={onClose}
          onOrderUpdated={() => fetchOrders(tab, false)}
        />
      )}
      contentContainerStyle={[
        styles.ordersList,
        { paddingBottom: Math.max(insets.bottom, 24) + 16 },
      ]}
      ListEmptyComponent={!isTabLoading[tab] ? renderEmptyState(tab) : null}
      onEndReachedThreshold={0.3}
      onEndReached={() => {
        if (isLoadingMore[tab] || isTabLoading[tab]) return;
        fetchOrders(tab, true);
      }}
      ListFooterComponent={
        isLoadingMore[tab] ? (
          <View style={styles.loadMoreContainer}>
            <ActivityIndicator size="small" color={isDark ? "#FBFCFF" : "#203686"} />
          </View>
        ) : null
      }
    />
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
        <ThemedView
          lightColor="#EBEDF0"
          darkColor="#040508"
          style={styles.modalContainer}
        >
          <ModalHeader
            title="Мои заказы"
            showBackButton={true}
            onBackPress={() => {
              onClose();
            }}
          />

          <ThemedView
            lightColor="#FFFFFF"
            darkColor="#151516"
            style={styles.content}
          >
            {
                <>
                    <View style={styles.tabsWrapper}>
                    <ThemedView
                        style={styles.tabsContainer}
                        lightColor={"#F2F4F7"}
                        darkColor="#202022"
                        onLayout={handleTabContainerLayout}
                    >
                        <Animated.View
                        style={[
                            styles.activeTabIndicator,
                            isDark && {
                            backgroundColor: "#101013",
                            },
                            {
                            width: tabContainerWidth,
                            transform: [{ translateX: indicatorPosition }],
                            },
                        ]}
                        />

                        <TouchableOpacity
                        style={[
                            styles.tabButton,
                            selectedTab === "active" && styles.activeTabButton,
                        ]}
                        onPress={() => handleTabChange("active")}
                        activeOpacity={0.7}
                        disabled={isTabLoading[selectedTab]}
                        >
                        <ThemedText
                            style={[
                            styles.tabText,
                            selectedTab === "active" && styles.activeTabText,
                            ]}
                            lightColor={
                            selectedTab === "active" ? "#1B1B1C" : "#80818B"
                            }
                            darkColor={
                            selectedTab === "active" ? "#FBFCFF" : "#FBFCFF80"
                            }
                        >
                            Активные 
                        </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                        style={[
                            styles.tabButton,
                            selectedTab === "completed" && styles.activeTabButton,
                        ]}
                        onPress={() => handleTabChange("completed")}
                        activeOpacity={0.7}
                        disabled={isTabLoading[selectedTab]}
                        >
                        <ThemedText
                            style={[
                            styles.tabText,
                            selectedTab === "completed" && styles.activeTabText,
                            ]}
                            lightColor={
                            selectedTab === "completed" ? "#1B1B1C" : "#80818B"
                            }
                            darkColor={
                            selectedTab === "completed" ? "#FBFCFF" : "#FBFCFF80"
                            }
                        >
                            Завершенные
                        </ThemedText>
                        </TouchableOpacity>
                    </ThemedView>
                    </View>

                    <View style={styles.tabContent}>
                    {isTabLoading[selectedTab] ? renderLoadingState() : (
                        selectedTab === "active" 
                        ? renderOrdersList(activeOrders, "active")
                        : renderOrdersList(completedOrders, "completed")
                    )}
                    </View>
                </>
            }

          </ThemedView>
        </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 36,
  },
  content: {
    marginTop: 8,
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: "20%",
  },
  ordersSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  ordersList: {
    gap: 8,
    paddingBottom: 20,
  },
  // Стили для табов
  tabsWrapper: {
    marginBottom: 16,
  },
  tabsContainer: {
    borderRadius: 12,
    padding: 3,
    flexDirection: "row",
    position: "relative",
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  activeTabButton: {
    backgroundColor: "transparent",
  },
  activeTabIndicator: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    height: "100%",
    top: 3,
    left: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabText: {
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
  },
  // Стили для пустого состояния
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  // Стили для загрузки
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
  },
  loadMoreContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
});