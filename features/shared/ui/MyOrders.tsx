// features/home/components/CompanySelectModal.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { getMyOrders } from "@/features/catalog/catalogSlice";
import OrdersCard from "@/features/home/ui/components/Orders/OrdersCard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    LayoutChangeEvent,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface MyOrdersProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = "active" | "completed";

export const MyOrdersModal: React.FC<MyOrdersProps> = ({
  visible,
  onClose,
}) => {
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";

  const [selectedTab, setSelectedTab] = useState<TabType>("active");
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const [tabAnim] = useState(new Animated.Value(0));

  const loading = useAppSelector((state) => state.catalog.isLoadingOrders);
  const orders = useAppSelector((state) => state.catalog.orders);

  const dispatch = useAppDispatch();

  useFocusEffect(
    useCallback(() => {
        dispatch(getMyOrders()).unwrap();
    }, [])
  );

  // Фильтрация заказов по статусу
  const activeOrders = orders.filter(
    (order) => order.orderStatus !== "Доставлен (закрыт)"
  );
  
  const completedOrders = orders.filter(
    (order) => order.orderStatus === "Доставлен (закрыт)"
  );

  const handleTabChange = (tab: TabType) => {
    Animated.spring(tabAnim, {
      toValue: tab === "active" ? 0 : 1,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
    setSelectedTab(tab);
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

  const renderOrdersList = (data: any[]) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => <OrdersCard order={item} fullWidth={true} />}
      contentContainerStyle={styles.ordersList}
      ListEmptyComponent={!loading ? renderEmptyState(selectedTab) : null}
    />
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
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
            {orders.length > 0 ?
            (
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
                        disabled={loading}
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
                        disabled={loading}
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
                    {loading ? renderLoadingState() : (
                        selectedTab === "active" 
                        ? renderOrdersList(activeOrders)
                        : renderOrdersList(completedOrders)
                    )}
                    </View>
                </>
            )
            :
            (
                <View style={styles.noOrders}>
                    <Image
                    source={require("@/assets/icons/png/noOrders.png")}
                    style={[styles.image]}
                    contentFit="cover"
                    />
                    <ThemedText style={styles.noOrdersText}>
                        У вас еще нет заказов.
                    </ThemedText>
                </View>
            )
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
    marginTop: 16,
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
  image: {
    width: 86,
    height: 86,
  },
  noOrders:{
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    margin: 'auto'
  },
  noOrdersText:{
    fontSize: 24,
    fontWeight: '600'
  }
});