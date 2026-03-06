import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
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
import { ModalHeader } from "@/features/auth/ui/Header";
import { TRootState } from "@/store/store";
import { PrimaryButton } from "../..";
import SpecialOffers from "../components/SpecialOffers/SpecialOffers";
import { useAppSelector } from "@/store/hooks";

const { height: screenHeight } = Dimensions.get("window");

interface BonusTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "accrual" | "write-off";
  balance: number;
  orderNumber?: string;
}

interface BonusPageProps {
  visible: boolean;
  onClose: () => void;
}

export const BonusPage: React.FC<BonusPageProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const dispatch = useDispatch();
  
  const user = useSelector((state: TRootState)=> state.auth.me);
  const me = useAppSelector((state) => state.auth.me);
  
  const [bonusHistory, setBonusHistory] = useState<BonusTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyModalTranslateY] = useState(new Animated.Value(screenHeight));
  const [isHistoryModalClosing, setIsHistoryModalClosing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadBonusHistory();
    }
  }, [visible]);

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
    }
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

  const loadBonusHistory = async () => {
    setIsLoading(true);
    try {
      // Здесь должен быть ваш API запрос
      // const response = await axdef.get("/api/bonus/history");
      // setBonusHistory(response.data.data);
      
      // Временные данные для демонстрации
      const mockHistory: BonusTransaction[] = [
        {
          id: "1",
          date: "2024-03-15T10:30:00",
          description: "Начисление за заказ №12345",
          amount: 150,
          type: "accrual",
          balance: 1250,
          orderNumber: "12345",
        },
        {
          id: "2",
          date: "2024-03-10T14:20:00",
          description: "Списание за заказ №12340",
          amount: -200,
          type: "write-off",
          balance: 1100,
          orderNumber: "12340",
        },
        {
          id: "3",
          date: "2024-03-05T09:15:00",
          description: "Начисление за заказ №12338",
          amount: 300,
          type: "accrual",
          balance: 1300,
          orderNumber: "12338",
        },
        {
          id: "4",
          date: "2024-02-28T16:45:00",
          description: "Начисление за регистрацию",
          amount: 500,
          type: "accrual",
          balance: 1000,
        },
        {
          id: "5",
          date: "2024-02-25T11:30:00",
          description: "Списание за заказ №12330",
          amount: -150,
          type: "write-off",
          balance: 500,
          orderNumber: "12330",
        },
        {
          id: "6",
          date: "2024-02-20T13:20:00",
          description: "Начисление за заказ №12325",
          amount: 250,
          type: "accrual",
          balance: 650,
          orderNumber: "12325",
        },
        {
          id: "7",
          date: "2024-02-15T10:00:00",
          description: "Начисление за заказ №12320",
          amount: 200,
          type: "accrual",
          balance: 400,
          orderNumber: "12320",
        },
        {
          id: "8",
          date: "2024-02-10T15:40:00",
          description: "Списание за заказ №12315",
          amount: -100,
          type: "write-off",
          balance: 200,
          orderNumber: "12315",
        },
      ];
      setBonusHistory(mockHistory);
    } catch (error) {
      console.error("Error loading bonus history:", error);
    } finally {
      setIsLoading(false);
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

  const formatNumber = (num: number) => {
    return num.toLocaleString("ru-RU");
  };

  const handleCopyBonusNumber = async () => {
    if (user?.bonusNumber) {
      await Clipboard.setStringAsync(user.bonusNumber);
    }
  };

  // Группировка истории по датам
  const groupedHistory = bonusHistory.reduce((groups, item) => {
    const date = formatDate(item.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, BonusTransaction[]>);

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
          title="TODO в разработке..."
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
            <PrimaryButton
                    title="Как потратить баллы?"
                    onPress={() => console.log("Отменить заказ")}
                    variant="third"
                    size="md"
                    activeOpacity={0.8}
                    fullWidth
                    style={styles.howButton}
                  />
          </ThemedView>

          <SpecialOffers />

          {/* История начислений */}
          <ThemedView lightColor="#FFFFFF" style={styles.historyBlock}>
            <View style={styles.historyHeader}>
              <ThemedText style={styles.historyTitle}>
                История начислений
              </ThemedText>
              <TouchableOpacity onPress={() => setHistoryModalVisible(true)}>
                <ThemedText lightColor="#203686" style={styles.moreButton}>
                  Подробнее
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Показываем первые 3 записи истории */}
            {bonusHistory.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.compactHistoryItem}>
                <View style={styles.compactHistoryLeft}>
                  <ThemedText lightColor="#80818B" darkColor="#FBFCFF80" style={styles.compactHistoryDate}>
                    {formatShortDateWithWeekday(item.date)}
                  </ThemedText>
                  {item.orderNumber && (
                    <ThemedText style={styles.compactHistoryOrder}>
                      Заказ №{item.orderNumber}
                    </ThemedText>
                  )}
                  <ThemedText lightColor="#80818B" darkColor="#FBFCFF80" style={styles.compactHistoryDescription} numberOfLines={1}>
                    {item.description}
                  </ThemedText>
                </View>
                <View style={styles.compactHistoryRight}>
                  <ThemedText
                    style={styles.compactHistoryAmount}
                  >
                    {item.type === "accrual" ? "+" : "-"}{Math.abs(item.amount)}
                  </ThemedText>
                </View>
              </View>
            ))}

          </ThemedView>

          {/* Отступ снизу */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Модалка с полной историей начислений */}
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
                >
                {/* Полная история, сгруппированная по датам */}
                <ThemedView lightColor="#FFFFFF" style={styles.fullHistoryBlock}>
                    {Object.entries(groupedHistory).map(([date, items]) => (
                    <View key={date} style={styles.dateGroup}>
                        <ThemedText style={styles.dateGroupTitle} lightColor="#80818B" darkColor="#FBFCFF80">
                        {date}
                        </ThemedText>
                        {items.map((item) => (
                        <View key={item.id} style={styles.fullHistoryItem}>
                            <View style={styles.fullHistoryItemLeft}>
                            {/* <ThemedText lightColor="#80818B" darkColor="#FBFCFF80" style={styles.fullHistoryDate}>
                                {formatShortDateWithWeekday(item.date)}
                            </ThemedText> */}
                            {item.orderNumber && (
                                <ThemedText style={styles.fullHistoryOrder} lightColor="#1B1B1C">
                                Заказ №{item.orderNumber}
                                </ThemedText>
                            )}
                            <ThemedText lightColor="#80818B" darkColor="#FBFCFF80" style={styles.fullHistoryDescription} numberOfLines={1}>
                                Сумма заказа
                            </ThemedText>
                            <ThemedText lightColor="#80818B" darkColor="#FBFCFF80" style={styles.fullHistoryDescription} numberOfLines={1}>
                                {item.description}
                            </ThemedText>
                            </View>
                            <View style={styles.fullHistoryItemRight}>
                            <ThemedText
                                style={styles.fullHistoryAmount}
                            >
                                {item.type === "accrual" ? "+" : "-"}{Math.abs(item.amount)}
                            </ThemedText>
                            </View>
                        </View>
                        ))}
                    </View>
                    ))}
                </ThemedView>

                {/* Отступ снизу */}
                <View style={styles.bottomSpacer} />
                </ScrollView>
            </ThemedView>
            </Modal>
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
  whiteBlockLast: {
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
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

  // Стили для компактной истории (на главной)
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
  compactHistoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginBottom: 16,
    paddingBottom: 16,
  },
  compactHistoryLeft: {
    flex: 1,
    gap: 4,
  },
  compactHistoryDate: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
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
  showAllButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  showAllText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Стили для полной истории (в модалке)
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
    // marginBottom: 16,
    paddingBottom: 16,
  },
  fullHistoryItemLeft: {
    flex: 1,
    gap: 4,
  },
  fullHistoryDate: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
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
});