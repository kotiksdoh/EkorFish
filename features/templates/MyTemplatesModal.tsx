import {
  ArrowIconRight,
  CalendarFilledIcon,
  CartIcon,
  IconCompanyNew,
  PencilIcon,
  TemplateCatalogIcon,
  TemplateFindProductsIcon,
} from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { setCompany } from "@/features/auth/authSlice";
import { useKeyboardAwareScroll } from "@/features/shared/hooks/useKeyboardAwareScroll";
import { AppModal } from "@/features/shared/ui/AppModal";
import { CompanySelectModal } from "@/features/shared/ui/CompanySelectModal";
import { CompanySelectionModal } from "@/features/shared/ui/CompanySelectionModalSmall";
import { CustomCheckbox } from "@/features/shared/ui/components/CustomCheckBox";
import AnimatedTextInput from "@/features/shared/ui/components/CustomInput";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import {
  createOrderPreset,
  deleteOrderPresetItem,
  deleteOrderPresetItemsBulk,
  fetchOrderPresetDetails,
  fetchOrderPresetPageData,
  fetchOrderPresets,
  updateOrderPreset,
  updateOrderPresetItemQuantity
} from "@/features/templates/orderPresetsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { isIndividualCompany } from "@/features/shared/utils/companyType";
import {
  buildPresetOwnerPayload,
  getPresetCompanyDisplayName,
  isPresetPrivateToLogin,
  resolveCompanyFromPreset,
} from "@/features/shared/utils/presetOwnerPayload";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, FlatList, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View, useColorScheme } from 'react-native';

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OrderFromTemplateConfirmOverlay } from "./OrderFromTemplateConfirmModal";
import { ReminderFrequencyPickerOverlay } from "./ReminderFrequencyPickerModal";
import { TemplateOrderLineCard } from "./TemplateOrderLineCard";
import { useTemplatePicker } from "./TemplatePickerContext";
import type { TemplateLineItem } from "./types";

const { height: screenHeight } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
};

function countGoodsWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return "товаров";
  if (d === 1) return "товар";
  if (d >= 2 && d <= 4) return "товара";
  return "товаров";
}

function formatMoney(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCreatedDate(ts: number): string {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatCreatedDateIso(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function adaptPresetItemToLine(item: any): TemplateLineItem {
  const step = typeof item.purchaseOptionStep === "number" && item.purchaseOptionStep > 0
    ? item.purchaseOptionStep
    : 1;
  return {
    productId: String(item.productId),
    productPurchaseOptionId: String(item.productPurchaseOptionId),
    quantity: typeof item.quantity === "number" ? item.quantity : 0,
    productName: item.productName ?? "",
    productImage: typeof item.productImage === "string" ? item.productImage : undefined,
    measureType: item.measureType,
    pricePerUnit: typeof item.price === "number" ? item.price : 0,
    step,
    minQuantity: step,
    isFavorite: !!item.isFavorite,
  };
}

export function MyTemplatesModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();
  const isDark = (systemTheme || "light") === "dark";
  const me = useAppSelector((s) => s.auth.me);
  const companies = me?.companies || [];
  const currentCompany = useAppSelector((s) => s.auth.currentCompany);
  const isIndividual = isIndividualCompany(currentCompany);
  const dispatch = useAppDispatch();
  const listOwnerFilter = useMemo(
    () => buildPresetOwnerPayload(currentCompany, me),
    [currentCompany, me],
  );

  const templates = useAppSelector((s) => s.orderPresets.list);
  const pageData = useAppSelector((s) => s.orderPresets.pageData);
  const isLoadingList = useAppSelector((s) => s.orderPresets.isLoadingList);
  const isLoadingDetails = useAppSelector((s) => s.orderPresets.isLoadingDetails);
  const isCreating = useAppSelector((s) => s.orderPresets.isCreating);
  const isLoadingPageData = useAppSelector((s) => s.orderPresets.isLoadingPageData);
  const isUpdating = useAppSelector((s) => s.orderPresets.isUpdating);
  const isDeletingBulk = useAppSelector((s) => s.orderPresets.isDeletingBulk);

  const {
    resumeDetailTemplateId,
    clearResumeDetail,
    startPickingCatalog,
    startPickingSearch,
  } = useTemplatePicker();

  const [detailId, setDetailId] = useState<string | null>(null);
  const detailPreset = useAppSelector((s) =>
    detailId ? s.orderPresets.details[detailId] : undefined,
  );
  const [detailEditing, setDetailEditing] = useState(false); // UI режим оставляем, но сохранение полей пока не поддержано API
  const [createOpen, setCreateOpen] = useState(false);
  const [orderConfirmOpen, setOrderConfirmOpen] = useState(false);
  const [orderConfirmTemplate, setOrderConfirmTemplate] = useState<any | null>(
    null,
  );
  const closeOrderConfirmRef = useRef<(() => void) | null>(null);

  const closeOrderConfirm = useCallback(() => {
    closeOrderConfirmRef.current = null;
    setOrderConfirmOpen(false);
    setOrderConfirmTemplate(null);
  }, []);

  const dismissOrderConfirmIfOpen = useCallback(() => {
    if (orderConfirmOpen && closeOrderConfirmRef.current) {
      closeOrderConfirmRef.current();
      return true;
    }
    return false;
  }, [orderConfirmOpen]);

  const [reminderPickerFor, setReminderPickerFor] = useState<
    "create" | "edit" | null
  >(null);

  // Раньше открывали детали сразу в edit-режиме по кнопке карандаша в карточке.
  // Теперь по требованиям всегда открываем сначала просмотр.
  const pendingEditAfterDetailLoadRef = useRef(false);

  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cReminder, setCReminder] = useState<number | null>(null);
  const [cSelectedCompany, setCSelectedCompany] = useState<any>(null);
  const [cIsPrivateToLogin, setCIsPrivateToLogin] = useState(true);
  const [eSelectedCompany, setESelectedCompany] = useState<any>(null);
  const [eIsPrivateToLogin, setEIsPrivateToLogin] = useState(true);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [companyModalFor, setCompanyModalFor] = useState<"create" | "edit" | null>(
    null,
  );
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const {
    scrollRef: createScrollRef,
    keyboardHeight: createKeyboardHeight,
    handleScroll: handleCreateScroll,
    onInputFocus: handleCreateDescFocus,
    androidKeyboardMargin: createAndroidKeyboardMargin,
  } = useKeyboardAwareScroll({
    enabled: createOpen && reminderPickerFor !== "create",
  });
  const [isClosingCreate, setIsClosingCreate] = useState(false);
  const createSheetTranslateY = useRef(new Animated.Value(screenHeight)).current;

  const [eName, setEName] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eReminder, setEReminder] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) {
      closeOrderConfirmRef.current = null;
      setDetailId(null);
      setDetailEditing(false);
      setCreateOpen(false);
      setIsClosingCreate(false);
      setOrderConfirmOpen(false);
      setOrderConfirmTemplate(null);
      setReminderPickerFor(null);
      setCompanyModalVisible(false);
      setCompanyModalFor(null);
      setRegisterModalVisible(false);
      clearResumeDetail();
      return;
    }

    dispatch(fetchOrderPresets(listOwnerFilter));
    dispatch(fetchOrderPresetPageData());
  }, [visible, listOwnerFilter, dispatch, clearResumeDetail]);

  useEffect(() => {
    if (visible && resumeDetailTemplateId) {
      const id = resumeDetailTemplateId;
      clearResumeDetail();
      setDetailId(id);
    }
  }, [visible, resumeDetailTemplateId, clearResumeDetail]);

  useEffect(() => {
    if (!visible || !detailId) return;
    dispatch(fetchOrderPresetDetails(detailId));
    pendingEditAfterDetailLoadRef.current = false;
    setDetailEditing(false);
  }, [detailId]);

  useEffect(() => {
    if (!detailPreset) return;
    setEName(detailPreset.name || "");
    setEDesc(detailPreset.description || "");
    setEReminder(detailPreset.reminderFrequency ?? 0);
    setESelectedCompany(
      resolveCompanyFromPreset(detailPreset, companies, me, currentCompany),
    );
    setEIsPrivateToLogin(isPresetPrivateToLogin(detailPreset));
    setSelectedItemIds(new Set());
  }, [
    detailPreset?.id,
    detailPreset?.companyId,
    detailPreset?.individualProfileId,
    companies,
    me,
  ]);

  useEffect(() => {
    if (!detailPreset) return;

    const presetCompany = resolveCompanyFromPreset(
      detailPreset,
      companies,
      me,
      currentCompany,
    );

    if (presetCompany?.id && presetCompany.id !== currentCompany?.id) {
      dispatch(setCompany(presetCompany));
    }
  }, [
    detailPreset?.id,
    detailPreset?.companyId,
    detailPreset?.individualProfileId,
    companies,
    dispatch,
    me,
  ]);

  const toggleSelectItem = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (!detailId) return;
    const ids = Array.from(selectedItemIds);
    if (ids.length === 0) return;
    await dispatch(deleteOrderPresetItemsBulk({ presetId: detailId, itemIds: ids }));
    setSelectedItemIds(new Set());
  };

  const resetTemplatesUiState = useCallback(() => {
    closeOrderConfirmRef.current = null;
    setOrderConfirmOpen(false);
    setOrderConfirmTemplate(null);
    setDetailId(null);
    setCreateOpen(false);
    setIsClosingCreate(false);
    setDetailEditing(false);
    setReminderPickerFor(null);
    setCompanyModalVisible(false);
    setCompanyModalFor(null);
    setRegisterModalVisible(false);
    clearResumeDetail();
  }, [clearResumeDetail]);

  const handleCloseAll = () => {
    if (dismissOrderConfirmIfOpen()) return;
    resetTemplatesUiState();
    onClose();
  };

  /** Синхронное закрытие при переходе к оформлению — без анимации order-confirm. */
  const handleForceCloseAll = () => {
    resetTemplatesUiState();
    onClose();
  };

  const handleCloseDetail = () => {
    if (dismissOrderConfirmIfOpen()) return;
    setDetailId(null);
    setDetailEditing(false);
    dispatch(fetchOrderPresets(listOwnerFilter));
  };

  const openCreate = () => {
    setCName("");
    setCDesc("");
    const first = pageData?.reminderFrequencies?.[0]?.frequency;
    setCReminder(typeof first === "number" ? first : 0);
    setCSelectedCompany(
      isIndividual
        ? currentCompany
        : currentCompany?.type !== "individual"
          ? currentCompany
          : companies[0] || null,
    );
    setCIsPrivateToLogin(true);
    setCreateOpen(true);
  };

  const openCompanyPicker = (target: "create" | "edit") => {
    if (isIndividual) return;
    dismissKeyboard();
    setCompanyModalFor(target);
    setCompanyModalVisible(true);
  };

  const handleSelectCompany = (company: any) => {
    if (companyModalFor === "create") {
      setCSelectedCompany(company);
    } else if (companyModalFor === "edit") {
      setESelectedCompany(company);
    }

    if (company?.id && company.id !== currentCompany?.id) {
      dispatch(setCompany(company));
    }

    setCompanyModalVisible(false);
    setCompanyModalFor(null);
  };

  const submitCreate = async () => {
    const name = cName.trim() || "Без названия";
    const description = cDesc.trim();
    const reminderFrequency = cReminder ?? 0;
    const ownerCompany = isIndividual ? currentCompany : cSelectedCompany;

    if (!isIndividual && !ownerCompany?.id) {
      return;
    }

    const ownerPayload = buildPresetOwnerPayload(ownerCompany, me);
    const res = await dispatch(
      createOrderPreset({
        name,
        description,
        reminderFrequency,
        ...ownerPayload,
        ...(ownerPayload.companyId
          ? { isPrivateToLogin: cIsPrivateToLogin }
          : {}),
      }),
    ).unwrap();
    const createdId = (res as any)?.id;
    setCreateOpen(false);
    if (createdId) {
      setDetailId(String(createdId));
    } else {
      dispatch(fetchOrderPresets(listOwnerFilter));
    }
  };

  const toggleEditPencil = async () => {
    if (!detailId || !detailPreset) return;
    if (detailEditing) {
      await handleSaveEdit();
    } else {
      setDetailEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!detailId || !detailPreset) return;

    const payload: {
      presetId: string;
      name: string;
      description: string;
      reminderFrequency: number;
      isPrivateToLogin?: boolean;
    } = {
      presetId: detailId,
      name: (eName || "").trim() || "Без названия",
      description: (eDesc || "").trim(),
      reminderFrequency: eReminder ?? 0,
    };

    if (!isIndividual) {
      payload.isPrivateToLogin = eIsPrivateToLogin;
    }

    await dispatch(updateOrderPreset(payload));
    setDetailEditing(false);
  };

  const updateDetailField = (_key: string, _value: any) => {};

  /** Уходит в каталог/поиск: закрываем обе модалки — полноэкранный Modal «Шаблоны» иначе остаётся поверх табов. */
  const leaveToPickCatalog = async () => {
    if (!detailId) return;
    const id = detailId;
    await startPickingCatalog(id);
    setDetailId(null);
    setDetailEditing(false);
    setOrderConfirmOpen(false);
    onClose();
  };

  const leaveToPickSearch = async () => {
    if (!detailId) return;
    const id = detailId;
    await startPickingSearch(id);
    setDetailId(null);
    setDetailEditing(false);
    setOrderConfirmOpen(false);
    onClose();
  };

  const removeItemById = (itemId: string) => {
    if (!detailId) return;
    dispatch(deleteOrderPresetItem({ presetId: detailId, itemId }));
  };

  const bumpLineQuantity = (item: any, delta: number) => {
    if (!detailId) return;
    const step =
      typeof item.purchaseOptionStep === "number" && item.purchaseOptionStep > 0
        ? item.purchaseOptionStep
        : 1;
    const minQ = step;
    let nextQty = (item.quantity || 0) + delta * step;
    if (delta < 0 && nextQty < minQ - 1e-6) {
      removeItemById(item.id);
      return;
    }
    nextQty = Math.max(minQ, nextQty);
    dispatch(
      updateOrderPresetItemQuantity({
        presetId: detailId,
        itemId: item.id,
        quantity: parseFloat(nextQty.toFixed(3)),
      }),
    );
  };

  const emptyList = (
    <View style={styles.emptyBox}>
      <Image
        source={require("@/assets/icons/png/templates.png")}
        style={styles.emptyImg}
        contentFit="contain"
      />
      <ThemedText style={styles.emptyTitle}>
        У вас пока нет шаблонов
      </ThemedText>
      <ThemedText
        style={styles.emptySub}
        lightColor="#80818B"
        darkColor="#FBFCFF80"
      >
        Здесь можно создавать шаблоны для регулярных заказов и быстрого
        повторения.
      </ThemedText>
      <PrimaryButton
        title="+ Создать шаблон"
        onPress={openCreate}
        variant="primary"
        fullWidth
      />
    </View>
  );

  const openDetailFromCard = (id: string) => {
    pendingEditAfterDetailLoadRef.current = false;
    setDetailId(id);
  };

  const openDetailEditFromCard = (id: string) => {
    setDetailId(id);
  };

  const openOrderConfirmFromList = (item: any) => {
    setOrderConfirmTemplate(item);
    setOrderConfirmOpen(true);
  };

  const renderCard = ({ item }: { item: any }) => {
    return (
      <View style={[styles.card, isDark && styles.cardDark]}>
        <TouchableOpacity
          onPress={() => openDetailFromCard(item.id)}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </ThemedText>
          <ThemedText
            style={styles.cardMeta}
            lightColor="#80818B"
            darkColor="#FBFCFF80"
          >
            {item.productsCount} {countGoodsWord(item.productsCount)} · ~{item?.totalProductsPrice} ₽
          </ThemedText>
          <ThemedText
            style={styles.cardCreated}
            lightColor="#80818B"
            darkColor="#FBFCFF80"
          >
            Создан: {formatCreatedDateIso(item.createdAt)}
          </ThemedText>
        </TouchableOpacity>
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[
              styles.cardOrderBtn,
              isDark && styles.cardOrderBtnDark,
            ]}
            onPress={() => openOrderConfirmFromList(item)}
            activeOpacity={0.85}
          >
            <CartIcon
              width={20}
              height={20}
              stroke={isDark ? "#1B1B1C" : "#FFFFFF"}
            />
            <ThemedText
              style={styles.cardOrderBtnText}
              lightColor="#FFFFFF"
              darkColor="#1B1B1C"
            >
              Создать заказ
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cardPencilWrap,
              isDark && styles.cardPencilWrapDark,
            ]}
            onPress={() => openDetailEditFromCard(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <PencilIcon
              width={20}
              height={20}
              fill={isDark ? "#FBFCFF" : "#1B1B1C"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const detailEmpty = !(detailPreset?.items?.length);
  const showTemplateBottomPanel =
    !!detailPreset && !detailEmpty && !detailEditing;
  const showEditBottomPanel = !!detailPreset && detailEditing;
  const showEditBulkActions = !!detailPreset && detailEditing && !detailEmpty;

  /** Список скрываем только при просмотре деталей (отдельный fullScreen Modal). */
  const templatesListModalVisible = visible && !detailId;

  useEffect(() => {
    if (createOpen) {
      setIsClosingCreate(false);
      createSheetTranslateY.setValue(screenHeight);
      Animated.spring(createSheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    } else {
      createSheetTranslateY.setValue(screenHeight);
    }
  }, [createOpen, createSheetTranslateY]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const closeCreateWithAnimation = useCallback(() => {
    if (isClosingCreate) return;

    Keyboard.dismiss();
    setIsClosingCreate(true);
    Animated.timing(createSheetTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsClosingCreate(false);
      setCreateOpen(false);
      setReminderPickerFor(null);
    });
  }, [createSheetTranslateY, isClosingCreate]);

  const handleCreateStackBackdropPress = useCallback(() => {
    Keyboard.dismiss();
    if (reminderPickerFor === "create") {
      setReminderPickerFor(null);
      return;
    }
    closeCreateWithAnimation();
  }, [reminderPickerFor, closeCreateWithAnimation]);

  const orderConfirmOverlay = orderConfirmTemplate ? (
    <OrderFromTemplateConfirmOverlay
      visible={orderConfirmOpen}
      template={orderConfirmTemplate}
      onClose={closeOrderConfirm}
      onCloseTemplates={handleForceCloseAll}
      onBindCloseRequest={(fn) => {
        closeOrderConfirmRef.current = fn;
      }}
    />
  ) : null;

  const onReminderPicked = (v: number) => {
    if (reminderPickerFor === "create") {
      setCReminder(v);
    } else if (detailPreset) {
      setEReminder(v);
    }
  };

  const reminderPickerValue =
    reminderPickerFor === "create" ? (cReminder ?? 0) : (eReminder ?? 0);

  const reminderPickerOverlay =
    reminderPickerFor === "edit" ? (
      <ReminderFrequencyPickerOverlay
        visible
        value={reminderPickerValue}
        onClose={() => setReminderPickerFor(null)}
        onSelect={onReminderPicked}
        options={pageData?.reminderFrequencies || []}
        showBackdrop
      />
    ) : null;

  const createReminderPickerOverlay =
    reminderPickerFor === "create" ? (
      <ReminderFrequencyPickerOverlay
        visible
        value={reminderPickerValue}
        onClose={() => setReminderPickerFor(null)}
        onSelect={onReminderPicked}
        options={pageData?.reminderFrequencies || []}
        showBackdrop={false}
      />
    ) : null;

  const activePickerCompany =
    companyModalFor === "create" ? cSelectedCompany : eSelectedCompany;

  const renderCompanySelectRow = (
    target: "create" | "edit",
    selectedCompany: any,
  ) => {
    const isDisabled = isIndividual || target === "edit";

    return (
    <TouchableOpacity
      style={[
        styles.sheetSelectRow,
        isDark && styles.sheetSelectRowDark,
        isDisabled && styles.sheetSelectRowDisabled,
      ]}
      onPress={() => openCompanyPicker(target)}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      <View style={styles.sheetRowIcon}>
        <IconCompanyNew
          width={22}
          height={22}
          color={isDark ? "#FBFCFF" : "#80818B"}
        />
      </View>
      <ThemedText
        style={styles.sheetRowFieldLabel}
        lightColor="#1B1B1C"
        darkColor="#FBFCFF"
      >
        Компания
      </ThemedText>
      <View style={styles.sheetRowRight}>
        <ThemedText
          style={styles.rowValue}
          numberOfLines={1}
          lightColor="#80818B"
          darkColor="#FBFCFF80"
        >
          {getPresetCompanyDisplayName(
            isIndividual ? currentCompany : selectedCompany,
            me,
          )}
        </ThemedText>
        {!isDisabled ? <ArrowIconRight /> : null}
      </View>
    </TouchableOpacity>
    );
  };

  const renderAvailabilitySection = (
    value: boolean,
    onChange: (next: boolean) => void,
  ) => {
    if (isIndividual) return null;

    const renderOption = (
      label: string,
      isSelected: boolean,
      onPress: () => void,
    ) => (
      <TouchableOpacity
        style={styles.availabilityOption}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.radioOuter,
            isSelected && styles.radioOuterSelected,
            isDark && isSelected && styles.radioOuterSelectedDark,
          ]}
        >
          {isSelected ? <View style={styles.radioInner} /> : null}
        </View>
        <ThemedText
          lightColor="#1B1B1C"
          darkColor="#FBFCFF"
          style={styles.availabilityOptionText}
        >
          {label}
        </ThemedText>
      </TouchableOpacity>
    );

    return (
      <View style={styles.availabilitySection}>
        <ThemedText
          style={styles.availabilityLabel}
          lightColor="#80818B"
          darkColor="#FBFCFF80"
        >
          Доступность
        </ThemedText>
        {renderOption("Только мне", value, () => onChange(true))}
        {renderOption("Всем сотрудникам компании", !value, () =>
          onChange(false),
        )}
      </View>
    );
  };

  const detailContent = (
    <AppModal
      visible={!!detailId}
      animationType="slide"
      onRequestClose={() => {
        if (dismissOrderConfirmIfOpen()) return;
        handleCloseDetail();
      }}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <ThemedView
        style={styles.detailRoot}
        lightColor="#EBEDF0"
        darkColor="#040508"
      >
        <ModalHeader
          title={detailPreset?.name ?? "Шаблон"}
          showBackButton
          onBackPress={handleCloseDetail}
          headerRight={
            <TouchableOpacity
              onPress={toggleEditPencil}
              disabled={!detailPreset}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <PencilIcon
                width={22}
                height={22}
                fill={isDark ? "#FBFCFF" : "#1B1B1C"}
              />
            </TouchableOpacity>
          }
        />

        <ThemedView
          style={styles.detailBody}
          lightColor="#FFFFFF"
          darkColor="#151516"
        >
          {isLoadingDetails && !detailPreset ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={isDark ? "#FBFCFF" : "#203686"} />
              <ThemedText
                style={styles.loadingText}
                lightColor="#80818B"
                darkColor="#FBFCFF80"
              >
                Загрузка шаблона...
              </ThemedText>
            </View>
          ) : !detailPreset ? (
            <View style={styles.loadingBox}>
              <ThemedText
                style={styles.loadingText}
                lightColor="#80818B"
                darkColor="#FBFCFF80"
              >
                Не удалось загрузить шаблон
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.detailScrollView}
              contentContainerStyle={[
                styles.detailScroll,
                showTemplateBottomPanel && styles.detailScrollWithBottomPanel,
                showEditBottomPanel &&
                  (showEditBulkActions
                    ? styles.detailScrollWithEditBottomPanelAndBulk
                    : styles.detailScrollWithEditBottomPanel),
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={dismissKeyboard}
            >
              {detailPreset && !detailEditing ? (
              <>
                {!isIndividual ? (
                  <View style={styles.metaRow}>
                    <View style={styles.metaIcon}>
                      <IconCompanyNew
                        width={22}
                        height={22}
                        color={isDark ? "#FBFCFF" : "#80818B"}
                      />
                    </View>
                    <ThemedText
                      style={styles.metaText}
                      lightColor="#1B1B1C"
                      darkColor="#FBFCFF"
                      numberOfLines={3}
                    >
                      {getPresetCompanyDisplayName(
                        resolveCompanyFromPreset(
                          detailPreset,
                          companies,
                          me,
                          currentCompany,
                        ),
                        me,
                      )}
                    </ThemedText>
                  </View>
                ) : null}
                <View
                  style={[styles.metaRow, !isIndividual && styles.metaRowSecond]}
                >
                  <View style={styles.metaIcon}>
                    <CalendarFilledIcon
                      width={22}
                      height={22}
                      stroke={isDark ? "#FBFCFF" : "#1B1B1C"}
                      fill="none"
                    />
                  </View>
                  <ThemedText
                    style={styles.metaText}
                    lightColor="#1B1B1C"
                    darkColor="#FBFCFF"
                  >
                    {(pageData?.reminderFrequencies || []).find(
                      (x: any) => x.frequency === detailPreset?.reminderFrequency,
                    )?.name || "—"}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.metaDivider,
                    isDark && { backgroundColor: "#323235" },
                  ]}
                />
              </>
            ) : null}

            {detailEditing && detailPreset ? (
              <>
                <AnimatedTextInput
                  placeholder="Название"
                  value={eName}
                  onChangeText={setEName}
                  multiline={false}
                />
                <View style={{ height: 12 }} />
                <AnimatedTextInput
                  placeholder="Описание"
                  value={eDesc}
                  onChangeText={setEDesc}
                  multiline
                  textAlignVertical="top"
                  style={styles.descInputWrap}
                  inputStyle={styles.descInput}
                />
                <View style={{ height: 12 }} />
                {!isIndividual
                  ? renderCompanySelectRow("edit", eSelectedCompany)
                  : null}
                <TouchableOpacity
                  style={[
                    styles.sheetSelectRow,
                    isDark && styles.sheetSelectRowDark,
                  ]}
                  onPress={() => setReminderPickerFor("edit")}
                >
                  <View style={styles.sheetRowIcon}>
                    <CalendarFilledIcon
                      width={22}
                      height={22}
                      stroke={isDark ? "#FBFCFF" : "#1B1B1C"}
                      fill="none"
                    />
                  </View>
                  <ThemedText
                    style={styles.sheetRowFieldLabel}
                    lightColor="#1B1B1C"
                    darkColor="#FBFCFF"
                  >
                    Частота напоминаний
                  </ThemedText>
                  <View style={styles.sheetRowRight}>
                    <ThemedText
                      style={styles.rowValue}
                      numberOfLines={1}
                      lightColor="#80818B"
                      darkColor="#FBFCFF80"
                    >
                      {(pageData?.reminderFrequencies || []).find(
                        (x: any) => x.frequency === (eReminder ?? 0),
                      )?.name || "—"}
                    </ThemedText>
                    <ArrowIconRight />
                  </View>
                </TouchableOpacity>
                {renderAvailabilitySection(eIsPrivateToLogin, setEIsPrivateToLogin)}
              </>
            ) : null}

            {detailEmpty && !detailEditing ? (
              <View style={styles.detailEmpty}>
                <Image
                  source={require("@/assets/icons/png/templates.png")}
                  style={styles.emptyImg}
                  contentFit="contain"
                />
                <ThemedText style={styles.detailEmptyTitle}>
                  Шаблон пуст
                </ThemedText>
                <ThemedText
                  style={styles.detailEmptySub}
                  lightColor="#80818B"
                  darkColor="#FBFCFF80"
                >
                  В этом шаблоне пока нет товаров
                </ThemedText>
              </View>
            ) : null}

            {!detailEmpty ? (
              <View style={{ marginTop: detailEditing ? 16 : 12 }}>
                <View style={styles.itemsHeaderRow}>
                  <ThemedText
                    style={styles.itemsTitle}
                    lightColor="#1B1B1C"
                    darkColor="#FBFCFF"
                  >
                    Товары
                  </ThemedText>
                  {showEditBulkActions ? (
                    <TouchableOpacity
                      onPress={() => void deleteSelected()}
                      disabled={selectedItemIds.size === 0 || isDeletingBulk}
                      activeOpacity={0.7}
                      hitSlop={8}
                      style={
                        selectedItemIds.size === 0 || isDeletingBulk
                          ? styles.deleteSelectedBtnDisabled
                          : undefined
                      }
                    >
                      <ThemedText style={styles.deleteSelectedText}>
                        {isDeletingBulk ? "Удаление..." : "Удалить выбранные"}
                      </ThemedText>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {(detailPreset?.items || []).map((it: any) => (
                  <View key={it.id} style={styles.itemRowWrap}>
                    {detailEditing ? (
                      <View style={styles.checkboxCol}>
                        <CustomCheckbox
                          style={undefined}
                          value={selectedItemIds.has(it.id)}
                          onValueChange={() => toggleSelectItem(it.id)}
                          lightColor="#F2F4F7"
                          darkColor="#202022"
                          disabled={false}
                        />
                      </View>
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <TemplateOrderLineCard
                        line={adaptPresetItemToLine(it)}
                        editMode={detailEditing}
                        onDecrease={() => bumpLineQuantity(it, -1)}
                        onIncrease={() => bumpLineQuantity(it, 1)}
                        onRemove={() => removeItemById(it.id)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {detailEmpty && !detailEditing ? (
              <View style={styles.footerInScroll}>
                <PrimaryButton
                  title="В каталог"
                  onPress={() => void leaveToPickCatalog()}
                  variant="primary"
                  fullWidth
                  leftIcon={
                    <TemplateCatalogIcon width={24} height={24} stroke="#FBFCFF" />
                  }
                />
                <View style={{ height: 10 }} />
                <PrimaryButton
                  title="Найти товары"
                  onPress={() => void leaveToPickSearch()}
                  variant="third"
                  fullWidth
                  leftIcon={
                    <TemplateFindProductsIcon
                      width={24}
                      height={24}
                      stroke="#1B1B1C"
                    />
                  }
                />
              </View>
            ) : null}
            </ScrollView>
          )}

          {showTemplateBottomPanel && detailPreset ? (
            <ThemedView
              lightColor="#FFFFFF"
              darkColor="#151516"
              style={[
                styles.bottomPanel,
                { paddingBottom: (Platform.OS === "ios" ? 34 : 16) + insets.bottom },
              ]}
            >
              <View style={styles.templateBottomSummary}>
                <View style={styles.totalTopRow}>
                  <ThemedText
                    style={styles.totalLabel}
                    lightColor="#1B1B1C"
                    darkColor="#FBFCFF"
                  >
                    Итого
                  </ThemedText>
                  <View style={styles.totalRightCol}>
                    <ThemedText
                      style={styles.totalCounts}
                      lightColor="#80818B"
                      darkColor="#FBFCFF80"
                    >
                      {(detailPreset?.productsCount || 0)}{" "}
                      {countGoodsWord(detailPreset?.productsCount || 0)} • 
                    </ThemedText>
                    <ThemedText
                      style={styles.totalQtyLine}
                      lightColor="#80818B"
                      darkColor="#FBFCFF80"
                    >
                      
                      {(detailPreset?.items || [])
                        .reduce((s: number, i: any) => s + (i.quantity || 0), 0)
                        .toLocaleString("ru-RU", {
                          maximumFractionDigits: 3,
                        })}{" "}кг
                    </ThemedText>
                  </View>
                </View>
                <ThemedText
                  style={styles.totalPrice}
                  lightColor="#1B1B1C"
                  darkColor="#FBFCFF"
                >
                  {formatMoney(detailPreset?.totalProductsPrice ?? 0)} ₽
                </ThemedText>
              </View>
              <PrimaryButton
                title="Сделать заказ по шаблону"
                onPress={() => {
                  setOrderConfirmTemplate(detailPreset);
                  setOrderConfirmOpen(true);
                }}
                variant="primary"
                fullWidth
              />
              <View style={{ height: 10 }} />
              <PrimaryButton
                title="Добавить товары"
                onPress={() => void leaveToPickCatalog()}
                variant="third"
                fullWidth
              />
            </ThemedView>
          ) : null}

          {showEditBottomPanel ? (
            <ThemedView
              lightColor="#FFFFFF"
              darkColor="#151516"
              style={[
                styles.bottomPanel,
                { paddingBottom: (Platform.OS === "ios" ? 34 : 16) + insets.bottom },
              ]}
            >
              <PrimaryButton
                title={isUpdating ? "Сохранение..." : "Сохранить"}
                onPress={() => void handleSaveEdit()}
                variant="primary"
                fullWidth
                disabled={isUpdating}
              />
            </ThemedView>
          ) : null}
        </ThemedView>
        {reminderPickerFor === "edit" ? reminderPickerOverlay : null}
        {orderConfirmOverlay}
      </ThemedView>

    </AppModal>
  );

  if (!visible) {
    return null;
  }

  return (
    <>
      <AppModal
        visible={templatesListModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (dismissOrderConfirmIfOpen()) return;
          if (createOpen) {
            closeCreateWithAnimation();
            return;
          }
          handleCloseAll();
        }}
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <ThemedView
          style={styles.listRoot}
          lightColor="#EBEDF0"
          darkColor="#040508"
        >
          <ModalHeader
            title="Шаблоны"
            showBackButton
            onBackPress={handleCloseAll}
          />
          <ThemedView
            style={styles.listContent}
            lightColor="#FFFFFF"
            darkColor="#151516"
          >
            {isLoadingList && templates.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={isDark ? "#FBFCFF" : "#203686"} />
                <ThemedText
                  style={styles.loadingText}
                  lightColor="#80818B"
                  darkColor="#FBFCFF80"
                >
                  Загрузка шаблонов...
                </ThemedText>
              </View>
            ) : templates.length === 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={styles.emptyScrollContent}
              >
                {emptyList}
              </ScrollView>
            ) : (
              <FlatList
                data={templates}
                keyExtractor={(it) => it.id}
                renderItem={renderCard}
                style={{ flex: 1 }}
                contentContainerStyle={[
                  styles.listPad,
                  { paddingBottom: 120 + Math.max(insets.bottom, 24) },
                ]}
                showsVerticalScrollIndicator={false}
              />
            )}

            {/* Нижняя кнопка только когда есть шаблоны; при пустом списке — кнопка в empty state */}
            {!isLoadingList && templates.length > 0 && (
              <View
                pointerEvents="box-none"
                style={[
                  styles.templatesBottomPanel,
                  {
                    paddingBottom:
                      Platform.OS === "android"
                        ? Math.max(insets.bottom, 24) + 16
                        : 28 + insets.bottom,
                  },
                ]}
              >
                <PrimaryButton
                  title="+ Создать шаблон"
                  onPress={openCreate}
                  variant="primary"
                  fullWidth
                />
              </View>
            )}
          </ThemedView>

          {createOpen ? (
            <View style={styles.innerOverlay}>
              <TouchableWithoutFeedback onPress={handleCreateStackBackdropPress}>
                <View style={styles.overlayBackdrop} />
              </TouchableWithoutFeedback>

              {reminderPickerFor !== "create" ? (
                  <Animated.View
                    style={[
                      styles.createOverlaySheet,
                      isDark && styles.createOverlaySheetDark,
                      {
                        paddingBottom: 16 + Math.max(insets.bottom, 16),
                        transform: [{ translateY: createSheetTranslateY }],
                        marginBottom:
                          Platform.OS === "ios" && createKeyboardHeight > 0
                            ? Math.max(0, createKeyboardHeight - insets.bottom)
                            : createAndroidKeyboardMargin,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.swipeHandleContainer}
                      activeOpacity={0.7}
                      onPress={closeCreateWithAnimation}
                    >
                      <View
                        style={[
                          styles.swipeHandle,
                          isDark && styles.swipeHandleDark,
                        ]}
                      />
                    </TouchableOpacity>
                    <View style={styles.createOverlayHeader}>
                      <ThemedText
                        style={styles.createOverlayTitle}
                        lightColor="#1B1B1C"
                        darkColor="#FBFCFF"
                      >
                        Создание шаблона
                      </ThemedText>
                    </View>
                <KeyboardAvoidingView
                  style={styles.createKeyboardAvoiding}
                  behavior={Platform.OS === "ios" ? "padding" : undefined}
                  keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
                >
                <ScrollView
                  ref={createScrollRef}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  onScrollBeginDrag={dismissKeyboard}
                  onScroll={handleCreateScroll}
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator={false}
                  style={styles.createOverlayScroll}
                  contentContainerStyle={{
                    paddingBottom: createKeyboardHeight > 0 ? 24 : 8,
                  }}
                >
                  <TouchableWithoutFeedback
                    onPress={dismissKeyboard}
                    accessible={false}
                  >
                    <View>
                  <AnimatedTextInput
                    placeholder="Название"
                    value={cName}
                    onChangeText={setCName}
                    multiline={false}
                    onFocus={handleCreateDescFocus}
                  />
                  <View style={{ height: 12 }} />
                  <AnimatedTextInput
                    placeholder="Описание"
                    value={cDesc}
                    onChangeText={setCDesc}
                    multiline
                    textAlignVertical="top"
                    onFocus={handleCreateDescFocus}
                    style={styles.descInputWrap}
                    inputStyle={styles.descInput}
                  />
                    </View>
                  </TouchableWithoutFeedback>
                  {!isIndividual
                    ? renderCompanySelectRow("create", cSelectedCompany)
                    : null}
                  <TouchableOpacity
                    style={[
                      styles.sheetSelectRow,
                      isDark && styles.sheetSelectRowDark,
                    ]}
                    onPress={() => {
                      dismissKeyboard();
                      setReminderPickerFor("create");
                    }}
                    disabled={
                      isLoadingPageData ||
                      !(pageData?.reminderFrequencies?.length)
                    }
                  >
                    <View style={styles.sheetRowIcon}>
                      <CalendarFilledIcon
                        width={22}
                        height={22}
                        stroke={isDark ? "#FBFCFF" : "#1B1B1C"}
                        fill="none"
                      />
                    </View>
                    <ThemedText
                      style={styles.sheetRowFieldLabel}
                      lightColor="#1B1B1C"
                      darkColor="#FBFCFF"
                    >
                      Частота напоминаний
                    </ThemedText>
                    <View style={styles.sheetRowRight}>
                      <ThemedText
                        style={styles.rowValue}
                        numberOfLines={1}
                        lightColor="#80818B"
                        darkColor="#FBFCFF80"
                      >
                        {isLoadingPageData
                          ? "Загрузка..."
                          : (pageData?.reminderFrequencies || []).find(
                              (x: any) => x.frequency === (cReminder ?? 0),
                            )?.name || "—"}
                      </ThemedText>
                      <ArrowIconRight />
                    </View>
                  </TouchableOpacity>
                  {renderAvailabilitySection(
                    cIsPrivateToLogin,
                    setCIsPrivateToLogin,
                  )}
                </ScrollView>
                <View style={{ height: 16 }} />
                <PrimaryButton
                  title="Создать шаблон"
                  onPress={submitCreate}
                  variant="primary"
                  fullWidth
                  disabled={
                    isCreating || (!isIndividual && !cSelectedCompany?.id)
                  }
                />
                </KeyboardAvoidingView>
                  </Animated.View>
              ) : null}

              {createReminderPickerOverlay}
            </View>
          ) : null}
          {!createOpen ? orderConfirmOverlay : null}
        </ThemedView>
      </AppModal>

      {detailContent}

      <CompanySelectionModal
        visible={companyModalVisible}
        onClose={() => {
          setCompanyModalVisible(false);
          setCompanyModalFor(null);
        }}
        companies={companies}
        selectedCompanyId={activePickerCompany?.id}
        onSelectCompany={handleSelectCompany}
        onAddCompany={() => {
          setCompanyModalVisible(false);
          setRegisterModalVisible(true);
        }}
      />

      <CompanySelectModal
        visible={registerModalVisible}
        onClose={() => setRegisterModalVisible(false)}
        companies={companies}
        selectedCompanyId={activePickerCompany?.id}
        onSelectCompany={(company) => {
          handleSelectCompany(company);
          setRegisterModalVisible(false);
        }}
        screenScene="register"
        onAddCompany={() => {}}
      />
    </>
  );
}

const styles = StyleSheet.create({
  listRoot: { flex: 1, position: "relative" },
  listContent: {
    flex: 1,
    marginTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  listPad: { padding: 16, paddingBottom: 120, gap: 10 },
  innerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 40,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  /** Высота sheet «Создание шаблона» — 75% экрана */
  createOverlaySheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    height: screenHeight * 0.75,
    maxHeight: screenHeight * 0.75,
    overflow: "hidden",
  },
  createOverlayScroll: {
    flex: 1,
  },
  createKeyboardAvoiding: {
    flex: 1,
  },
  createOverlaySheetDark: {
    backgroundColor: "#202022",
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
  swipeHandleDark: {
    backgroundColor: "#404040",
  },
  createOverlayHeader: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    alignItems: "flex-start",
  },
  createOverlayTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "left",
  },
  templatesBottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: "transparent",
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F2F4F7",
    gap: 12,
  },
  cardDark: { backgroundColor: "#202022" },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardMeta: { marginTop: 4, fontSize: 13 },
  cardCreated: { marginTop: 6, fontSize: 13 },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardOrderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#1B1B1C",
  },
  cardOrderBtnDark: {
    backgroundColor: "#FBFCFF",
  },
  cardOrderBtnText: { fontSize: 15, fontWeight: "600" },
  cardPencilWrap: {
    borderRadius: 8,
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  cardPencilWrapDark: {
    backgroundColor: "#2C2C2E",
    borderColor: "#323235",
  },
  emptyBox: {
    padding: 24,
    alignItems: "center",
    gap: 16,
    justifyContent: "center",
  },
  emptyImg: { width: 120, height: 120 },
  emptyTitle: { fontSize: 22, fontWeight: "600", textAlign: "center" },
  emptySub: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  emptyScrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingBottom: 24,
    justifyContent: "center",
  },
  detailRoot: { flex: 1, position: "relative" },
  detailBody: {
    flex: 1,
    marginTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  detailScrollView: { flex: 1 },
  detailScroll: { padding: 16, paddingBottom: 40 },
  // Отступ под нижнюю панель в режиме просмотра (высокая) и редактирования (низкая)
  detailScrollWithBottomPanel: {
    paddingBottom: Platform.OS === "ios" ? 280 : 260,
  },
  detailScrollWithEditBottomPanel: {
    paddingBottom: Platform.OS === "ios" ? 160 : 140,
  },
  detailScrollWithEditBottomPanelAndBulk: {
    paddingBottom: Platform.OS === "ios" ? 210 : 190,
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
    gap: 4,
  },
  templateBottomSummary: {
    marginBottom: 8,
    gap: 8,
  },
  itemsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  itemsTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  deleteSelectedBtnDisabled: {
    opacity: 0.45,
  },
  deleteSelectedText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#C12B2B",
  },
  itemRowWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkboxCol: {
    paddingTop: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  metaRowSecond: {
    paddingTop: 0,
  },
  metaIcon: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  metaDivider: {
    height: 1,
    backgroundColor: "#F0F3F7",
    marginBottom: 8,
    marginTop: 4,
  },
  totalTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "600",
  },
  totalRightCol: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 4,
  },
  totalCounts: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  totalQtyLine: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "600",
  },
  footerInScroll: {
    marginTop: 16,
    paddingBottom: 8,
  },
  detailEmpty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  detailEmptyTitle: { fontSize: 20, fontWeight: "600" },
  detailEmptySub: { fontSize: 15, textAlign: "center" },
  sheetSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#F0F3F7",
    marginBottom: 8,
    gap: 6,
  },
  sheetSelectRowDark: {
    borderColor: "#252527",
  },
  sheetSelectRowDisabled: {
    opacity: 0.55,
  },
  availabilitySection: {
    marginTop: 8,
    marginBottom: 4,
  },
  availabilityLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  availabilityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  availabilityOptionText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8DADE",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#203686",
    borderWidth: 5,
  },
  radioOuterSelectedDark: {
    borderColor: "#4C94FF",
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  sheetRowIcon: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRowFieldLabel: {
    fontSize: 15,
    fontWeight: "500",
    width: 132,
    flexShrink: 0,
  },
  sheetRowRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    minWidth: 0,
  },
  rowValue: { fontSize: 14, flexShrink: 1, textAlign: "right" },
  descInputWrap: {
    minHeight: 120,
    height: 120,
  },
  descInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
});
