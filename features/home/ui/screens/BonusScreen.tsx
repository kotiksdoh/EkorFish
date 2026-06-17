// BonusPage.tsx

import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { LemonIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { clearBonusHistory, getBonusHistory } from "@/features/auth/authSlice";
import { AddToCart } from "@/features/catalog/catalogSlice";
import { ModalHeader } from "@/features/auth/ui/Header";
import { AddToCartModal } from "@/features/shared/ui/AddToCartModal";
import { useAppSelector } from "@/store/hooks";
import { TRootState } from "@/store/store";
import { PrimaryButton } from "../..";
import SpecialOffers from "../components/SpecialOffers/SpecialOffers";

const { height: screenHeight } = Dimensions.get("window");
const PAGE_SIZE = 10;

interface BonusTransaction {
  id?: string | number;
  orderNumber: string;
  orderAmount: number;
  date: string;
  bonus: number;
  type: "accrual" | "write-off";
  description: string;
}

interface BonusPageProps {
  visible: boolean;
  onClose: () => void;
}

function getOrderNumber(item: BonusTransaction): string | null {
  const raw = item.orderNumber;
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim();
  return value.length > 0 ? value : null;
}

function isBonusAccrual(item: BonusTransaction): boolean {
  if (item.type === "accrual") return true;
  if (item.type === "write-off") return false;
  return item.bonus > 0;
}

function getBonusTransactionTitle(item: BonusTransaction): string {
  const orderNumber = getOrderNumber(item);
  if (orderNumber) {
    return `Заказ №${orderNumber}`;
  }
  return isBonusAccrual(item) ? "Начисление" : "Списание";
}

function shouldShowOrderAmount(item: BonusTransaction): boolean {
  return getOrderNumber(item) !== null;
}

function getBonusHistoryItemKey(
  item: BonusTransaction,
  index: number,
  dateKey: string,
): string {
  const idPart =
    item.id !== null && item.id !== undefined && String(item.id).length > 0
      ? String(item.id)
      : "no-id";
  return `${dateKey}-${idPart}-${index}`;
}

export const BonusPage: React.FC<BonusPageProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const dispatch = useDispatch<any>();
  
  const user = useSelector((state: TRootState)=> state.auth.me);
  const me = useAppSelector((state) => state.auth.me);
  
  // Получаем данные из Redux
  const bonusHistory = useSelector((state: TRootState) => state.auth.bonusHistory) as BonusTransaction[];
  const isLoadingBonus = useSelector((state: TRootState) => state.auth.isLoadingBonus);
  const hasMoreBonus = useSelector((state: TRootState) => state.auth.hasMoreBonus);
  const currentBonusPage = useSelector((state: TRootState) => state.auth.currentBonusPage);
  const cartItems = useAppSelector((state) => state.catalog.cart);
  
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyModalTranslateY] = useState(new Animated.Value(screenHeight));
  const [isHistoryModalClosing, setIsHistoryModalClosing] = useState(false);
  
  // Состояние для отслеживания загрузки следующих страниц
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [existingCartItem, setExistingCartItem] = useState<any>(null);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  
  // Ref для предотвращения множественных запросов
  const isFetchingRef = useRef(false);

  // Загружаем историю при открытии основного экрана (первые 10 записей)
  useEffect(() => {
    if (visible) {
      loadBonusHistory(0, PAGE_SIZE, false);
    }
    
    // Очищаем историю при закрытии модалки
    return () => {
      if (!visible) {
        dispatch(clearBonusHistory());
      }
    };
  }, [visible]);

  // Загружаем историю при открытии модалки с полной историей (первые 10 записей)
  useEffect(() => {
    if (historyModalVisible) {
      historyModalTranslateY.setValue(screenHeight);
      Animated.spring(historyModalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
      
      // При открытии модалки загружаем свежие данные
      loadBonusHistory(0, PAGE_SIZE, true);
    }
    
    // Очищаем историю при закрытии модалки истории
    return () => {
      if (!historyModalVisible) {
        dispatch(clearBonusHistory());
      }
    };
  }, [historyModalVisible]);

  const closeHistoryModal = () => {
    if (isHistoryModalClosing) return;

    setIsHistoryModalClosing(true);
    Animated.timing(historyModalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsHistoryModalClosing(false);
      setHistoryModalVisible(false);
    });
  };

  const loadBonusHistory = (offset: number, count: number, isModal: boolean = false) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    
    dispatch(getBonusHistory({ offset, count }))
      .finally(() => {
        setTimeout(() => {
          isFetchingRef.current = false;
        }, 300);
      });
  };

  // Функция для загрузки следующих страниц
  const loadMoreHistory = useCallback(() => {
    if (!hasMoreBonus || isLoadingBonus || isLoadingMore || isFetchingRef.current) return;
    
    const nextOffset = (currentBonusPage + 1) * PAGE_SIZE;
    setIsLoadingMore(true);
    
    dispatch(getBonusHistory({ offset: nextOffset, count: PAGE_SIZE }))
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [hasMoreBonus, isLoadingBonus, isLoadingMore, currentBonusPage, dispatch]);

  // Обработчик скролла для определения достижения конца списка
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom) {
      loadMoreHistory();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
  };

  const formatShortDateWithWeekday = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyBonusNumber = async () => {
    if (user?.bonusNumber) {
      await Clipboard.setStringAsync(user.bonusNumber);
    }
  };

  const handleAddToCartPress = (product: any) => {
    const cartItemsForProduct =
      cartItems?.filter((item: any) => item.productId === product.id) || [];

    setSelectedProduct(product);
    setExistingCartItem(cartItemsForProduct);
    setShowAddToCartModal(true);
  };

  const handleAddToCart = (
    productId: string,
    optionId: string,
    quantity: number,
  ) => {
    dispatch(
      AddToCart({
        productId,
        productPurchaseOptionId: optionId,
        quantity,
      }),
    );
  };

  // Группировка первых 3 записей по дате для компактного отображения
  const getGroupedFirstThree = () => {
    if (!bonusHistory?.length) return [];
    
    const firstThree = bonusHistory.slice(0, 3);
    const grouped: { [key: string]: BonusTransaction[] } = {};
    
    firstThree.forEach((item) => {
      const dateKey = formatShortDateWithWeekday(item.date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    
    return Object.entries(grouped);
  };

  // Группировка всей истории по датам для полной модалки
  const groupedFullHistory = bonusHistory?.length 
    ? bonusHistory.reduce((groups, item) => {
        const date = formatDate(item.date);
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(item);
        return groups;
      }, {} as Record<string, BonusTransaction[]>)
    : {};

  const groupedFirstThree = getGroupedFirstThree();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <ThemedView
        style={styles.container}
        lightColor="#EBEDF0"
        darkColor="#040508"
      >
        {/* Хедер с кнопкой закрытия */}
        <ModalHeader
          title="Бонусная программа"
          showBackButton={true}
          onBackPress={onClose}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.content}
        >
          {/* Основной блок с балансом */}
          <ThemedView lightColor="#FFFFFF" style={styles.whiteBlock}>
            <ThemedView style={styles.bonusBlock} lightColor="#F2F4F7" darkColor="#202022">
                <View>
                    <ThemedText style={styles.greyText} darkColor="#FBFCFF80" lightColor="#80818B">Доступно для списания</ThemedText>
                </View>
                <View style={styles.bonusRow}>
                    <View style={styles.bonusRowMain}>
                    <LemonIcon height={20} width={20}/>
                    <ThemedText style={styles.mainText}>
                      {me?.bonus || 0}
                    </ThemedText>
                    </View>
                    <ThemedText darkColor="#FBFCFF80" lightColor="#80818B">1 балл = 1 ₽</ThemedText>
                </View>
                <View style={styles.bigBonus}>
                <LemonIcon height={51} width={51}/>
                </View>
            </ThemedView>
            {/* <PrimaryButton
                    title="Как потратить баллы?"
                    onPress={() => console.log("Как потратить баллы")}
                    variant="third"
                    size="md"
                    activeOpacity={0.8}
                    fullWidth
                    style={styles.howButton}
                  /> */}
          </ThemedView>

          <SpecialOffers
            handleAddToCartPress={handleAddToCartPress}
            onShowAllPress={onClose}
            onProductPress={onClose}
          />

          {/* История начислений - компактный блок с группировкой */}
          <ThemedView lightColor="#FFFFFF" style={styles.historyBlock}>
            <View style={styles.historyHeader}>
              <ThemedText style={styles.historyTitle}>
                История начислений
              </ThemedText>
              <TouchableOpacity 
                onPress={() => setHistoryModalVisible(true)}
                disabled={!bonusHistory?.length && !isLoadingBonus}
              >
                <ThemedText 
                  lightColor="#203686" 
                  style={[
                    styles.moreButton,
                    (!bonusHistory?.length && !isLoadingBonus) && styles.disabledButton
                  ]}
                >
                  Подробнее
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Проверка на наличие истории */}
            {isLoadingBonus && bonusHistory.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#203686" />
              </View>
            ) : bonusHistory.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <ThemedText style={styles.emptyStateText} lightColor="#80818B" darkColor="#FBFCFF80">
                  Пока нет начислений
                </ThemedText>
              </View>
            ) : (
              // Группированное отображение первых записей
              groupedFirstThree.map(([date, items], groupIndex) => (
                <View key={`compact-group-${date}-${groupIndex}`} style={styles.compactDateGroup}>
                  <ThemedText lightColor="#80818B" darkColor="#FBFCFF80" style={styles.compactDateTitle}>
                    {date}
                  </ThemedText>
                  {items.map((item, index) => (
                    <View key={getBonusHistoryItemKey(item, index, date)} style={styles.compactHistoryItem}>
                      <View style={styles.compactHistoryLeft}>
                        <ThemedText style={styles.compactHistoryOrder}>
                          {getBonusTransactionTitle(item)}
                        </ThemedText>
                        {shouldShowOrderAmount(item) && (
                          <ThemedText
                            lightColor="#80818B"
                            darkColor="#FBFCFF80"
                            style={styles.compactHistoryDescription}
                            numberOfLines={1}
                          >
                            Сумма заказа:{" "}
                            {item.orderAmount?.toLocaleString("ru-RU")} ₽
                          </ThemedText>
                        )}
                      </View>
                      <View style={styles.compactHistoryRight}>
                        <ThemedText
                          style={[
                            styles.compactHistoryAmount,
                            { color: item.bonus > 0 ? "#27AE60" : "#EB5757" }
                          ]}
                        >
                          {item.bonus > 0 ? "+" : ""}{item.bonus}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </ThemedView>

          {/* Отступ снизу */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Модалка с полной историей начислений - без группировки по датам внутри дня */}
        <Modal
            visible={historyModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={closeHistoryModal}
            statusBarTranslucent={true}
            >
            <ThemedView
                style={styles.container}
                lightColor="#EBEDF0"
                darkColor="#040508"
            >
                {/* Хедер модалки истории */}
                <ModalHeader
                title="История начислений"
                showBackButton={true}
                onBackPress={closeHistoryModal}
                />

                <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.content}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                >
                {/* Полная история - каждая запись отдельно, но сгруппирована по дням */}
                <ThemedView lightColor="#FFFFFF" style={styles.fullHistoryBlock}>
                  {isLoadingBonus && bonusHistory.length === 0 ? (
                    <View style={styles.initialLoadingContainer}>
                      <ActivityIndicator size="large" color="#203686" />
                      <ThemedText style={styles.initialLoadingText}>
                        Загрузка истории...
                      </ThemedText>
                    </View>
                  ) : Object.keys(groupedFullHistory).length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                      <ThemedText style={styles.emptyStateText} lightColor="#80818B" darkColor="#FBFCFF80">
                        Пока нет начислений
                      </ThemedText>
                    </View>
                  ) : (
                    <>
                      {Object.entries(groupedFullHistory).map(([date, items], groupIndex) => (
                        <View key={`full-group-${date}-${groupIndex}`} style={styles.dateGroup}>
                          <ThemedText style={styles.dateGroupTitle} lightColor="#80818B" darkColor="#FBFCFF80">
                            {date}
                          </ThemedText>
                          {items.map((item, index) => (
                            <View key={getBonusHistoryItemKey(item, index, date)} style={styles.fullHistoryItem}>
                              <View style={styles.fullHistoryItemLeft}>
                                <ThemedText
                                  style={styles.fullHistoryOrder}
                                  lightColor="#1B1B1C"
                                >
                                  {getBonusTransactionTitle(item)}
                                </ThemedText>
                                {shouldShowOrderAmount(item) && (
                                  <ThemedText
                                    lightColor="#80818B"
                                    darkColor="#FBFCFF80"
                                    style={styles.fullHistoryDescription}
                                    numberOfLines={1}
                                  >
                                    Сумма заказа:{" "}
                                    {item.orderAmount?.toLocaleString("ru-RU")} ₽
                                  </ThemedText>
                                )}
                              </View>
                              <View style={styles.fullHistoryItemRight}>
                                <ThemedText
                                  style={[
                                    styles.fullHistoryAmount,
                                    { color: item.bonus > 0 ? "#27AE60" : "#EB5757" }
                                  ]}
                                >
                                  {item.bonus > 0 ? "+" : ""}{item.bonus}
                                </ThemedText>
                              </View>
                            </View>
                          ))}
                        </View>
                      ))}
                      
                      {/* Индикатор загрузки при пагинации */}
                      {isLoadingMore && (
                        <View style={styles.paginationLoader}>
                          <ActivityIndicator size="small" color="#203686" />
                          <ThemedText style={styles.loadingText}>
                            Загрузка...
                          </ThemedText>
                        </View>
                      )}
                      
                    </>
                  )}
                </ThemedView>

                {/* Отступ снизу */}
                <View style={styles.bottomSpacer} />
                </ScrollView>
            </ThemedView>
            </Modal>
        <AddToCartModal
          visible={showAddToCartModal}
          onClose={() => {
            setShowAddToCartModal(false);
            setExistingCartItem(null);
          }}
          product={selectedProduct}
          onAddToCart={handleAddToCart}
          existingCartItem={existingCartItem}
          variant="cart"
        />
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
  whiteBlock: {
    borderRadius: 24,
    padding: 20,
  },
  bonusBlock: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden'
  },
  bonusRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  bonusRowMain: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greyText:{
    fontWeight: '600',
    fontSize: 14
  },
  mainText:{
    fontWeight: '600',
    fontSize: 24
  },
  bigBonus: {
    position: 'absolute',
    top: -8,
    right: -10
  },
  howButton: {
    marginTop: 16
  },
  historyBlock: {
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  moreButton: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Стили для компактной истории с группировкой
  compactDateGroup: {
    marginBottom: 16,
  },
  compactDateTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
  },
  compactHistoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    marginLeft: 0,
  },
  compactHistoryLeft: {
    flex: 1,
    gap: 4,
  },
  compactHistoryOrder: {
    fontSize: 16,
    fontWeight: "500",
  },
  compactHistoryDescription: {
    fontSize: 12,
    fontWeight: "400",
  },
  compactHistoryRight: {
    justifyContent: "center",
    marginLeft: 12,
  },
  compactHistoryAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Стили для полной истории
  fullHistoryBlock: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateGroupTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
    paddingBottom: 8,
  },
  fullHistoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  fullHistoryItemLeft: {
    flex: 1,
    gap: 4,
  },
  fullHistoryOrder: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  fullHistoryDescription: {
    fontSize: 12,
    fontWeight: "400",
  },
  fullHistoryItemRight: {
    justifyContent: "center",
    marginLeft: 12,
  },
  fullHistoryAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 20,
  },
  initialLoadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  initialLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#80818B",
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationLoader: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#80818B",
  },
  endOfList: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  endOfListText: {
    fontSize: 12,
    color: "#80818B",
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
});