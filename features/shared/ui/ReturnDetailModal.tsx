import {
  ArrowIconLeft,
  ArrowIconRight,
  CalendarFilledIcon,
  Copy,
  IconAccept,
  IconCard,
  IconCloseNew,
  IconCompanyNew,
  IconDocument,
  IconGeo,
  IconMessage,
  IconNumber
} from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getReturnRequestDetail } from "@/features/catalog/catalogSlice";
import type { ReturnReasonId } from "@/features/returns/returnReason";
import { isReturnReasonSelected } from "@/features/returns/returnReason";
import { axdef, baseUrl } from "@/features/shared/services/axios";
import { AppModal } from "@/features/shared/ui/AppModal";
import { openTelegramByPhone } from "@/features/shared/utils/phoneLinking";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, Linking, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SnapBottomSheet } from "./SnapBottomSheet";
import { PrimaryButton } from "./components/PrimartyButton";

const { height: screenHeight } = Dimensions.get("window");

const RETURN_STATUS_ORDER = ["pending", "approved", "rejected"] as const;

function normalizeReturnStatusKey(status: unknown): string {
  return String(status ?? "").trim().toLowerCase();
}

function sortReturnStatuses(list: any[]): any[] {
  return [...list].sort((a, b) => {
    const aIndex = RETURN_STATUS_ORDER.indexOf(
      normalizeReturnStatusKey(a.status) as (typeof RETURN_STATUS_ORDER)[number],
    );
    const bIndex = RETURN_STATUS_ORDER.indexOf(
      normalizeReturnStatusKey(b.status) as (typeof RETURN_STATUS_ORDER)[number],
    );
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
}

function filterReturnStatusTimeline(
  statuses: any[],
  currentStatus: unknown,
): any[] {
  const currentKey = normalizeReturnStatusKey(currentStatus);
  return statuses.filter((item) => {
    const itemKey = normalizeReturnStatusKey(item.status);
    if (currentKey === "approved" && itemKey === "rejected") {
      return false;
    }
    if (currentKey === "rejected" && itemKey === "approved") {
      return false;
    }
    return true;
  });
}

interface ReturnDetailModalProps {
  visible: boolean;
  onClose: () => void;
  returnRequestId: number | null;
}

interface CompanyManager {
  id: string;
  name?: string;
  phoneNumber?: string;
}

type ReturnLine = {
  id: string;
  productName: string;
  productImage?: string;
  price: number;
  returnQuantity: number;
  measureType: string;
  totalPrice: number;
  reason?: ReturnReasonId;
  reasonName?: string;
  comment?: string;
};

type OrderDocument = {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
};

export const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  visible,
  onClose,
  returnRequestId,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [productsModalVisible, setProductsModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [documents, setDocuments] = useState<OrderDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [productsModalTranslateY] = useState(new Animated.Value(screenHeight));
  const [isProductsModalClosing, setIsProductsModalClosing] = useState(false);
  const [companyManager, setCompanyManager] = useState<CompanyManager | null>(
    null,
  );

  const detail = useAppSelector((state) => state.catalog.return);
  const isLoading = useAppSelector(
    (state) => state.catalog.isLoadingReturnDetail,
  );
  const pageData = useAppSelector(
    (state) => state.catalog.returnsStatuses,
  ) as any;
  const dispatch = useAppDispatch();
  console.log('returnsStatuses', pageData)
  useEffect(() => {
    if (visible && returnRequestId) {
      dispatch(getReturnRequestDetail(returnRequestId));
    } else {
      setDocumentsModalVisible(false);
      setDocuments([]);
      setIsLoadingDocuments(false);
    }
  }, [visible, returnRequestId, dispatch]);

  useEffect(() => {
    const hydrateCompanyManager = async () => {
      if (!visible) {
        setCompanyManager(null);
        return;
      }
      try {
        const storedCompanyRaw = await AsyncStorage.getItem("company");
        const storedCompany = storedCompanyRaw ? JSON.parse(storedCompanyRaw) : null;
        setCompanyManager(storedCompany?.manager || null);
      } catch (error) {
        console.error("Error loading company manager from storage:", error);
        setCompanyManager(null);
      }
    };

    void hydrateCompanyManager();
  }, [visible]);

  // Анимация для модалки с товарами
  useEffect(() => {
    if (productsModalVisible) {
      productsModalTranslateY.setValue(screenHeight);
      Animated.spring(productsModalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    }
  }, [productsModalVisible]);

  const closeProductsModal = () => {
    if (isProductsModalClosing) return;
    setIsProductsModalClosing(true);
    Animated.timing(productsModalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsProductsModalClosing(false);
      setProductsModalVisible(false);
    });
  };

  const closeStatusModal = () => {
    setStatusModalVisible(false);
  };

  const handleCopyId = async () => {
    if (detail) {
      await Clipboard.setStringAsync(detail.id.toString());
    }
  };

  const handleMessageManager = () => {
    void openTelegramByPhone(companyManager);
  };

  const openDocumentsModal = async () => {
    const orderId = detail?.orderId;
    if (!orderId) return;

    setDocumentsModalVisible(true);
    setIsLoadingDocuments(true);
    try {
      const response = await axdef.get(`/api/Order/${orderId}/documents`);
      setDocuments(response?.data?.data || []);
    } catch (error) {
      console.error("Error loading order documents:", error);
      Alert.alert("Ошибка", "Не удалось загрузить документы возврата");
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleOpenDocument = async (fileUrl: string) => {
    try {
      const normalizedUrl =
        fileUrl?.startsWith("http://") || fileUrl?.startsWith("https://")
          ? fileUrl
          : `${baseUrl}/${String(fileUrl || "").replace(/^\/+/, "")}`;

      const canOpen = await Linking.canOpenURL(normalizedUrl);
      if (!canOpen) {
        Alert.alert("Ошибка", "Не удалось открыть документ");
        return;
      }
      await Linking.openURL(normalizedUrl);
    } catch (error) {
      console.error("Error opening document:", error);
      Alert.alert("Ошибка", "Не удалось открыть документ");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const formatStatusDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const reasonNameById = useMemo(() => {
    const reasons = pageData?.returnReasons || [];
    const map = new Map<string, string>();
    reasons.forEach((r: any) => {
      if (r?.reason !== undefined && r?.reason !== null) {
        map.set(String(r.reason), r.name);
      }
    });
    return map;
  }, [pageData]);

  const returnMethodName = useMemo(() => {
    const list = pageData?.returnMethods || [];
    return list.find((m: any) => m.method === detail?.returnMethod)?.name || "-";
  }, [pageData, detail?.returnMethod]);

  const refundMethodName = useMemo(() => {
    const list = pageData?.refundMethods || [];
    return list.find((m: any) => m.method === detail?.refundMethod)?.name || "-";
  }, [pageData, detail?.refundMethod]);

  const allLines: ReturnLine[] = useMemo(() => {
    const directItems = detail?.items || [];
    const orders = detail?.orders || [];
    const lines: ReturnLine[] = [];

    if (directItems.length > 0) {
      directItems.forEach((it: any) => {
        const price = Number(it.unitPrice || 0);
        const returnQuantity = Number(it.returnQuantity || 0);
        lines.push({
          id: String(it.id ?? `${detail?.orderId}_${it.orderProductId}`),
          productName: it.productName ?? "",
          productImage: it.productImage,
          price,
          returnQuantity,
          measureType: it.measureType ?? "шт",
          totalPrice: price * returnQuantity,
          reason:
            it.reason !== undefined && it.reason !== null && it.reason !== ""
              ? it.reason
              : undefined,
          reasonName:
            it.reason !== undefined && it.reason !== null && it.reason !== ""
              ? reasonNameById.get(String(it.reason))
              : undefined,
          comment: it.comment || "",
        });
      });
      return lines;
    }

    orders.forEach((o: any) => {
      (o.items || []).forEach((it: any) => {
        const price = Number(it.unitPrice || 0);
        const returnQuantity = Number(it.returnQuantity || 0);
        lines.push({
          id: String(it.id ?? `${o.orderId}_${it.orderProductId}`),
          productName: it.productName ?? "",
          productImage: it.productImage,
          price,
          returnQuantity,
          measureType: it.measureType ?? "шт",
          totalPrice: price * returnQuantity,
          reason:
            it.reason !== undefined && it.reason !== null && it.reason !== ""
              ? it.reason
              : undefined,
          reasonName:
            it.reason !== undefined && it.reason !== null && it.reason !== ""
              ? reasonNameById.get(String(it.reason))
              : undefined,
          comment: it.comment || "",
        });
      });
    });
    return lines;
  }, [detail, reasonNameById]);

  const getMeasureLabel = (measureType?: string) => {
    const normalized = String(measureType || "").toLowerCase();
    return normalized === "килограмм" || normalized === "кг" ? "кг" : "шт";
  };

  const renderReturnItemCard = (item: ReturnLine, key: string) => {
    const imageSource = item.productImage
      ? { uri: `${baseUrl}/${item.productImage}` }
      : require("@/assets/icons/png/noImage.png");
    const hasReason = isReturnReasonSelected(item.reason);

    return (
      <ThemedView
        key={key}
        darkColor="#151516"
        lightColor="#FFFFFF"
        style={styles.returnItemContainer}
      >
        <View style={styles.contUnder}>
        <View style={styles.returnItemImageContainer}>
          <Image source={imageSource} style={styles.returnItemImage} contentFit="cover" />
        </View>

        <View style={styles.returnItemInfoContainer}>
        <View>
          <View style={styles.returnItemHeaderRow}>
            <ThemedText
              style={styles.returnItemProductName}
              numberOfLines={2}
              lightColor="#202022"
              darkColor="#F2F4F7"
            >
              {item.productName}
            </ThemedText>
            <ThemedText
              style={styles.returnItemTotalPrice}
              lightColor="#202022"
              darkColor="#F2F4F7"
            >
              {formatPrice(item.totalPrice)} ₽
            </ThemedText>
          </View>
         </View>
       
        </View>
        </View>
        {hasReason && item.reasonName ? (
            <ThemedView
              style={[
                styles.returnItemReasonSection,
                !isDarkMode && styles.returnItemReasonSectionLight,
                isDarkMode && styles.returnItemReasonSectionDark,
              ]}
            >
              <View style={styles.returnItemReasonContent}>
                <ThemedText
                  style={styles.returnItemSelectedReason}
                  lightColor="#1B1B1C"
                  darkColor="#F2F4F7"
                >
                  {item.reasonName}
                  {item.comment ? ` (${item.comment})` : ""}
                </ThemedText>
                {/* <ThemedText
                  style={styles.returnItemQtyLine}
                  lightColor="#80818B"
                  darkColor="#FBFCFF80"
                >
                  {formatPrice(item.price)}₽ / {getMeasureLabel(item.measureType)} •{" "}
                  {item.returnQuantity} {getMeasureLabel(item.measureType)}
                </ThemedText> */}
              </View>
            </ThemedView>
          ) : (
            <ThemedView
              style={[
                styles.returnItemReasonSection,
                !isDarkMode && styles.returnItemReasonSectionLight,
                isDarkMode && styles.returnItemReasonSectionDark,
              ]}
            >
              <ThemedText
                style={styles.returnItemSelectedReason}
                lightColor="#80818B"
                darkColor="#FBFCFF80"
              >
                Причина не указана
              </ThemedText>
              {/* <ThemedText
                style={styles.returnItemQtyLine}
                lightColor="#80818B"
                darkColor="#FBFCFF80"
              >
                {formatPrice(item.price)}₽ / {getMeasureLabel(item.measureType)} •{" "}
                {item.returnQuantity} {getMeasureLabel(item.measureType)}
              </ThemedText> */}
            </ThemedView>
          )}
      </ThemedView>
    );
  };

  const statusList = useMemo(() => {
    const list = pageData?.returnRequestStatuses || [];
    const sorted = sortReturnStatuses(list);
    const filtered = detail
      ? filterReturnStatusTimeline(sorted, detail.status)
      : sorted;

    // На Android иногда приходит пустой справочник статусов,
    // поэтому показываем хотя бы текущий статус заявки, чтобы модалка не была пустой.
    if (filtered.length === 0 && detail) {
      return [
        {
          status: detail.status ?? 0,
          name: "Статус обновляется",
        },
      ];
    }

    return filtered;
  }, [pageData, detail]);

  const getCurrentStatusName = () => {
    if (!detail) return "";
    const currentKey = normalizeReturnStatusKey(detail.status);
    const s = statusList.find(
      (x: any) => normalizeReturnStatusKey(x.status) === currentKey,
    );
    return s?.name || "Статус обновляется";
  };

  const getCurrentStatusIndex = () => {
    if (!detail) return -1;
    const currentKey = normalizeReturnStatusKey(detail.status);
    return statusList.findIndex(
      (x: any) => normalizeReturnStatusKey(x.status) === currentKey,
    );
  };

  if (!visible) return null;

  return (
    <>
      <AppModal
        visible={visible}
        animationType="none"
        transparent={false}
        onRequestClose={onClose}
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
      >
        <ThemedView
          style={styles.container}
          lightColor="#EBEDF0"
          darkColor="#040508"
        >
          <ThemedView style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <ArrowIconLeft color={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <ThemedText style={styles.headerTitle}>Детали возврата</ThemedText>
            </View>

            <TouchableOpacity onPress={handleCopyId} style={styles.copyButton}>
              <Copy fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
            </TouchableOpacity>
          </ThemedView>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#203686" />
              <ThemedText style={styles.loadingText}>Загрузка...</ThemedText>
            </View>
          ) : !detail ? (
            <View style={styles.errorContainer}>
              <ThemedText>Возврат не найден</ThemedText>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.content}
            >
              <ThemedView lightColor="#FFFFFF" style={styles.whiteBlock}>
                <TouchableOpacity
                  style={[styles.statusRow]}
                  onPress={() => setStatusModalVisible(true)}
                >
                  <ThemedText
                    lightColor="#203686"
                    darkColor="#4C94FF"
                    style={styles.statusText}
                  >
                    {getCurrentStatusName()}
                  </ThemedText>
                  <ArrowIconRight />
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                  <View style={styles.infoRow}>
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <IconNumber />
                    </ThemedView>
                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && { borderColor: "#252527" },
                      ]}
                    >
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Номер возврата
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        №{detail.id}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <CalendarFilledIcon stroke="#80818B" fill="none" />
                    </ThemedView>
                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && { borderColor: "#252527" },
                      ]}
                    >
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Дата создания
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {formatDate(detail.createdAt)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <IconCompanyNew />
                    </ThemedView>
                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && { borderColor: "#252527" },
                      ]}
                    >
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Способ возврата
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {returnMethodName}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <IconGeo />
                    </ThemedView>
                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && { borderColor: "#252527" },
                      ]}
                    >
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        {detail.storageName ? "Склад" : "Адрес возврата"}
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {detail.storageName || detail.deliveryAddress || "-"}
                      </ThemedText>
                    </View>
                  </View>

                  {/* <View style={styles.infoRow}>
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <IconUser />
                    </ThemedView>
                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && { borderColor: "#252527" },
                      ]}
                    >
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Получатель
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>-</ThemedText>
                    </View>
                  </View> */}

                  <View style={styles.infoRow}>
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <IconCard />
                    </ThemedView>
                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && { borderColor: "#252527" },
                      ]}
                    >
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Способ возврата денег
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {refundMethodName}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.totalContainer}>
                  <ThemedText lightColor="#80818B" style={styles.totalLabel}>
                    Итого
                  </ThemedText>
                  <ThemedText style={styles.totalValue}>
                    {formatPrice(detail.totalAmount)} ₽
                  </ThemedText>
                </View>

                <View style={styles.weightContainer}>
                  <ThemedText lightColor="#80818B" style={styles.weightLabel}>
                    Общий вес заказа
                  </ThemedText>
                  <ThemedText lightColor="#80818B" style={styles.weightValue}>
                    {detail.totalWeight} кг
                  </ThemedText>
                </View>

                <View style={styles.buttonsRow}>
                  <PrimaryButton
                    title="Отменить"
                    onPress={() => Alert.alert("Отмена", "Недоступно для возврата")}
                    variant="third"
                    size="md"
                    activeOpacity={0.8}
                    fullWidth
                    style={styles.cancelButton}
                    customIcon={
                      <IconCloseNew
                        color={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                      />
                    }
                  />
                  <PrimaryButton
                    title="Написать"
                    onPress={handleMessageManager}
                    variant="third"
                    size="md"
                    style={styles.messageButton}
                    activeOpacity={0.8}
                    fullWidth
                    disabled={!companyManager}
                    customIcon={
                      <IconMessage color={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
                    }
                  />
                </View>
                <PrimaryButton
                  title="Документы"
                  onPress={openDocumentsModal}
                  variant="third"
                  size="md"
                  style={styles.documentsButton}
                  activeOpacity={0.8}
                  fullWidth
                  disabled={!detail?.orderId}
                  customIcon={
                    <IconDocument color={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
                  }
                />
              </ThemedView>

              <ThemedView lightColor="#FFFFFF" style={styles.productsBlock}>
                <View style={styles.productsHeader}>
                  <ThemedText style={styles.productsTitle}>
                    Товары к возврату
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setProductsModalVisible(true)}
                  >
                    <ThemedText lightColor="#203686" style={styles.moreButton}>
                      Подробнее
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {allLines.slice(0, 2).map((item) => (
                  renderReturnItemCard(item, item.id)
                ))}

                {allLines.length === 0 && (
                  <ThemedText
                    style={styles.emptyProductsText}
                    lightColor="#80818B"
                    darkColor="#FBFCFF80"
                  >
                    Нет товаров в составе возврата
                  </ThemedText>
                )}

                {allLines.length > 2 && (
                  <TouchableOpacity
                    style={styles.showAllButton}
                    onPress={() => setProductsModalVisible(true)}
                  >
                    <ThemedText lightColor="#203686" style={styles.showAllText}>
                      Показать все товары ({allLines.length})
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          )}
        </ThemedView>

        <AppModal
          visible={productsModalVisible}
          animationType="none"
          transparent={true}
          onRequestClose={closeProductsModal}
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
        >
          <TouchableWithoutFeedback onPress={closeProductsModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContainer,
                    { paddingBottom: insets.bottom },
                    { transform: [{ translateY: productsModalTranslateY }] },
                    isDarkMode && { backgroundColor: "#202022" },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.swipeHandleContainer}
                    activeOpacity={0.7}
                    onPress={closeProductsModal}
                  >
                    <View style={styles.swipeHandle} />
                  </TouchableOpacity>

                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Состав возврата</ThemedText>
                  </View>

                  <ScrollView
                    style={styles.productsList}
                    showsVerticalScrollIndicator={false}
                  >
                    {allLines.map((item) => (
                      <View key={item.id}>{renderReturnItemCard(item, `m_${item.id}`)}</View>
                    ))}
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </AppModal>

        <SnapBottomSheet
          visible={statusModalVisible}
          title="Статус вашего возврата"
          titleAlign="left"
          onClose={closeStatusModal}
        >
          <ScrollView
            style={styles.statusesList}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            bounces
            contentContainerStyle={styles.statusesListContent}
          >
              {statusList.map((status: any, index: number) => {
                        const currentIndex = getCurrentStatusIndex();
                        const isCurrent = index === currentIndex;
                        const isNext = index === currentIndex + 1;
                        const isPast = index < currentIndex;
                        const isFuture = index > currentIndex + 1;
                        const isLast = index === statusList.length - 1;

                        let lineColors: [string, string];
                        if (isPast || isCurrent) {
                          lineColors = !isDarkMode
                            ? ["#203686", "#203686"]
                            : ["#3881EE", "#3881EE"];
                        } else if (isNext) {
                          lineColors = !isDarkMode
                            ? ["#203686", "#80818B"]
                            : ["#3881EE", "#80818B"];
                        } else {
                          lineColors = ["#80818B", "#80818B"];
                        }

                        return (
                          <View
                            key={String(status.status)}
                            style={styles.statusItemContainer}
                          >
                            <View style={styles.statusLeftColumn}>
                              <View
                                style={[
                                  styles.statusCircle,
                                  (isPast || isCurrent) &&
                                    styles.statusCircleCompleted,
                                  isDarkMode &&
                                    (isPast || isCurrent) && {
                                      borderColor: "#3881EE",
                                      backgroundColor: "#3881EE",
                                    },
                                  isNext && styles.statusCircleNext,
                                  isDarkMode &&
                                    isNext && {
                                      backgroundColor: "#202022",
                                      borderColor: "#3881EE",
                                    },
                                  isFuture && styles.statusCirclePending,
                                  isDarkMode &&
                                    isFuture && { backgroundColor: "#202022" },
                                ]}
                              >
                                {(isPast || isCurrent) && (
                                  <View style={styles.statusCircleCheckmark}>
                                    <IconAccept />
                                  </View>
                                )}
                                {isNext && (
                                  <View
                                    style={[
                                      styles.statusCurrentDot,
                                      isDarkMode && {
                                        backgroundColor: "#3881EE",
                                      },
                                    ]}
                                  />
                                )}
                              </View>

                              {!isLast && (
                                <View style={styles.statusLineContainer}>
                                  <LinearGradient
                                    colors={lineColors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={styles.statusLine}
                                  />
                                </View>
                              )}
                            </View>

                            <View style={styles.statusRightColumn}>
                              <View style={styles.statusTextContainer}>
                                <ThemedText
                                  style={[
                                    styles.statusName,
                                    (isPast || isCurrent || isNext) &&
                                      styles.statusNameCompleted,
                                    isDarkMode &&
                                      (isPast || isCurrent || isNext) && {
                                        color: "#FBFCFF",
                                      },
                                  ]}
                                >
                                  {status.name}
                                </ThemedText>
                                <ThemedText
                                  lightColor="#80818B"
                                  darkColor="#80818B"
                                  style={styles.statusDate}
                                >
                                  {formatStatusDate(
                                    isCurrent ? detail?.createdAt : null,
                                  )}
                                </ThemedText>
                              </View>
                            </View>
                          </View>
                        );
              })}
          </ScrollView>
        </SnapBottomSheet>

        <SnapBottomSheet
          visible={documentsModalVisible}
          title="Документы возврата"
          titleAlign="left"
          onClose={() => setDocumentsModalVisible(false)}
        >
          {isLoadingDocuments ? (
            <View style={styles.documentsLoader}>
              <ActivityIndicator
                size="small"
                color={isDarkMode ? "#4C94FF" : "#203686"}
              />
            </View>
          ) : documents.length === 0 ? (
            <ThemedText
              style={styles.documentsEmpty}
              lightColor="#80818B"
              darkColor="#FBFCFF80"
            >
              Документы не найдены
            </ThemedText>
          ) : (
            <View style={styles.documentsList}>
              {documents.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.documentItem,
                    { backgroundColor: isDarkMode ? "#2E2E32" : "#F2F4F7" },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleOpenDocument(doc.fileUrl)}
                >
                  <ThemedText style={styles.documentName} numberOfLines={1}>
                    {doc.fileName}
                  </ThemedText>
                  <ArrowIconRight />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SnapBottomSheet>
      </AppModal>
    </>
  );
};

// Стили — копия из OrderDetailModal.tsx (с минимальными правками).
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
    gap: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: { padding: 8 },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    alignItems: "center",
    justifyContent: "center",
  },
  copyButton: { padding: 8 },
  content: { flex: 1, marginTop: 8 },
  whiteBlock: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    marginBottom: 16,
  },
  statusText: { fontSize: 20, fontWeight: "600" },
  infoContainer: { marginBottom: 20 },
  infoRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconPlaceholder: { padding: 8, borderRadius: 8 },
  infoContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F3F7",
    paddingBottom: 12,
  },
  infoLabel: { fontSize: 14, fontWeight: "500" },
  infoValue: { fontSize: 16, fontWeight: "500" },
  totalContainer: { flexDirection: "column" },
  totalLabel: { fontSize: 16, fontWeight: "500" },
  totalValue: { fontSize: 16, fontWeight: "600" },
  weightContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    gap: 3,
  },
  weightLabel: { fontSize: 14, fontWeight: "400" },
  weightValue: { fontSize: 14, fontWeight: "500" },
  buttonsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  messageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  documentsButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  documentsLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  documentsEmpty: {
    fontSize: 14,
    fontWeight: "500",
    paddingBottom: 16,
  },
  documentsList: {
    gap: 8,
    paddingBottom: 16,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  productsBlock: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  productsTitle: { fontSize: 20, fontWeight: "600" },
  moreButton: { fontSize: 14, fontWeight: "500" },
  // Карточка товара — как в SelectedReturnItem (ReturnsSecondStep)
  returnItemContainer: {
    flexDirection: "column",
    // padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  contUnder: {
    flexDirection: "row",

  },
  returnItemImageContainer: {
    width: 74,
    height: 55,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
  },
  returnItemImage: {
    width: "100%",
    height: "100%",
  },
  returnItemInfoContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  returnItemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  returnItemProductName: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
    flex: 1,
  },
  returnItemTotalPrice: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 0,
  },
  returnItemReasonSection: {
    marginTop: 16,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  returnItemReasonSectionLight: {
    backgroundColor: "#F2F4F7",
  },
  returnItemReasonSectionDark: {
    backgroundColor: "#202022",
  },
  returnItemReasonContent: { flex: 1 },
  returnItemSelectedReason: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 16,
  },
  returnItemQtyLine: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  showAllButton: { alignItems: "center", paddingVertical: 12 },
  showAllText: { fontSize: 14, fontWeight: "500" },
  emptyProductsText: { fontSize: 14, fontWeight: "500" },
  bottomSpacer: { height: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 16, color: "#80818B" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  swipeHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    width: "100%",
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  modalHeader: { paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 20, fontWeight: "600" },
  productsList: { paddingHorizontal: 16, paddingBottom: 24 },
  // Старые стили карточек состава оставлены неиспользуемыми — можно удалить позже
  statusesList: {
    maxHeight: screenHeight * 0.55,
  },
  statusesListContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statusItemContainer: {
    flexDirection: "row",
    minHeight: 60,
  },
  statusLeftColumn: {
    width: 30,
    alignItems: "center",
    position: "relative",
  },
  statusCircle: {
    marginTop: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  statusCircleCompleted: {
    borderColor: "#203686",
    backgroundColor: "#203686",
  },
  statusCircleNext: {
    borderColor: "#203686",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
  },
  statusCirclePending: {
    borderColor: "#80818B",
    backgroundColor: "#FFFFFF",
  },
  statusCircleCheckmark: {
    width: 10,
    height: 10,
    position: "relative",
  },
  statusCurrentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#203686",
  },
  statusLineContainer: {
    position: "absolute",
    top: 20,
    width: 2,
    height: 45,
    alignItems: "center",
  },
  statusLine: {
    width: 2,
    height: "120%",
  },
  statusRightColumn: {
    flex: 1,
    paddingLeft: 12,
  },
  statusTextContainer: {},
  statusName: { fontSize: 16, fontWeight: "500", color: "#80818B" },
  statusNameCompleted: { color: "#1B1B1C" },
  statusDate: { fontSize: 12, fontWeight: "400" },
});

