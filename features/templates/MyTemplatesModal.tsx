import {
  ArrowIconRight,
  CalendarFilledIcon,
  CartIcon,
  IconCompanyNew,
  PencilIcon,
} from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { CompanySelectModal } from "@/features/shared/ui/CompanySelectModal";
import AnimatedTextInput from "@/features/shared/ui/components/CustomInput";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import { useAppSelector } from "@/store/hooks";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { OrderFromTemplateConfirmModal } from "./OrderFromTemplateConfirmModal";
import { ReminderFrequencyPickerModal } from "./ReminderFrequencyPickerModal";
import { TemplateOrderLineCard } from "./TemplateOrderLineCard";
import { useTemplatePicker } from "./TemplatePickerContext";
import {
  createTemplateId,
  getTemplateById,
  loadTemplates,
  upsertTemplate,
} from "./templateStorage";
import type { OrderTemplate, ReminderFrequency } from "./types";
import { REMINDER_LABELS } from "./types";

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

export function MyTemplatesModal({ visible, onClose }: Props) {
  const systemTheme = useColorScheme();
  const isDark = (systemTheme || "light") === "dark";
  const me = useAppSelector((s) => s.auth.me);
  const currentCompany = useAppSelector((s) => s.auth.currentCompany);

  const {
    resumeDetailTemplateId,
    clearResumeDetail,
    startPickingCatalog,
    startPickingSearch,
  } = useTemplatePicker();

  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailTemplate, setDetailTemplate] = useState<OrderTemplate | null>(
    null,
  );
  const [detailEditing, setDetailEditing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [companyForScene, setCompanyForScene] = useState<"create" | "edit">(
    "create",
  );
  const [orderConfirmOpen, setOrderConfirmOpen] = useState(false);
  const [orderConfirmTemplate, setOrderConfirmTemplate] =
    useState<OrderTemplate | null>(null);
  const [reminderPickerFor, setReminderPickerFor] = useState<
    "create" | "edit" | null
  >(null);

  const pendingEditAfterDetailLoadRef = useRef(false);

  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cCompanyId, setCCompanyId] = useState<string | null>(
    currentCompany?.id ?? null,
  );
  const [cCompanyName, setCCompanyName] = useState<string | null>(
    currentCompany?.name ?? null,
  );
  const [cReminder, setCReminder] = useState<ReminderFrequency>("weekly");

  const refreshList = useCallback(async () => {
    setTemplates(await loadTemplates());
  }, []);

  useEffect(() => {
    if (visible) {
      refreshList();
    } else {
      setDetailId(null);
      setDetailTemplate(null);
      setDetailEditing(false);
      setCreateOpen(false);
      setCompanyModalVisible(false);
      setOrderConfirmOpen(false);
      setOrderConfirmTemplate(null);
      setReminderPickerFor(null);
    }
  }, [visible, refreshList]);

  useEffect(() => {
    if (visible && resumeDetailTemplateId) {
      const id = resumeDetailTemplateId;
      clearResumeDetail();
      setDetailId(id);
    }
  }, [visible, resumeDetailTemplateId, clearResumeDetail]);

  useEffect(() => {
    let cancelled = false;
    if (!detailId) {
      setDetailTemplate(null);
      return;
    }
    (async () => {
      const t = await getTemplateById(detailId);
      if (!cancelled) {
        setDetailTemplate(t);
        if (pendingEditAfterDetailLoadRef.current) {
          pendingEditAfterDetailLoadRef.current = false;
          setDetailEditing(!!t);
        } else {
          setDetailEditing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const handleCloseAll = () => {
    setDetailId(null);
    setDetailTemplate(null);
    setCreateOpen(false);
    setDetailEditing(false);
    onClose();
  };

  const handleCloseDetail = () => {
    setDetailId(null);
    setDetailTemplate(null);
    setDetailEditing(false);
    refreshList();
  };

  const openCreate = () => {
    setCName("");
    setCDesc("");
    setCCompanyId(currentCompany?.id ?? me?.companies?.[0]?.id ?? null);
    setCCompanyName(
      currentCompany?.name ?? me?.companies?.[0]?.name ?? null,
    );
    setCReminder("weekly");
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const now = Date.now();
    const t: OrderTemplate = {
      id: createTemplateId(),
      name: cName.trim() || "Без названия",
      description: cDesc.trim(),
      companyId: cCompanyId,
      companyName: cCompanyName,
      reminderFrequency: cReminder,
      items: [],
      createdAt: now,
      updatedAt: now,
    };
    await upsertTemplate(t);
    await refreshList();
    setCreateOpen(false);
    setDetailId(t.id);
  };

  const persistDetail = async (t: OrderTemplate) => {
    await upsertTemplate(t);
    setDetailTemplate(t);
    await refreshList();
  };

  const toggleEditPencil = async () => {
    if (!detailTemplate) return;
    if (detailEditing) {
      await persistDetail(detailTemplate);
      setDetailEditing(false);
    } else {
      setDetailEditing(true);
    }
  };

  const updateDetailField = <K extends keyof OrderTemplate>(
    key: K,
    value: OrderTemplate[K],
  ) => {
    if (!detailTemplate) return;
    setDetailTemplate({ ...detailTemplate, [key]: value });
  };

  const selectCompanyCreate = (co: any) => {
    setCCompanyId(co?.id ?? null);
    setCCompanyName(co?.name ?? null);
    setCompanyModalVisible(false);
  };

  const selectCompanyEdit = (co: any) => {
    if (!detailTemplate) return;
    setDetailTemplate({
      ...detailTemplate,
      companyId: co?.id ?? null,
      companyName: co?.name ?? null,
    });
    setCompanyModalVisible(false);
  };

  /** Уходит в каталог/поиск: закрываем обе модалки — полноэкранный Modal «Шаблоны» иначе остаётся поверх табов. */
  const leaveToPickCatalog = async () => {
    if (!detailTemplate) return;
    const id = detailTemplate.id;
    await startPickingCatalog(id);
    setDetailId(null);
    setDetailTemplate(null);
    setDetailEditing(false);
    setOrderConfirmOpen(false);
    onClose();
  };

  const leaveToPickSearch = async () => {
    if (!detailTemplate) return;
    const id = detailTemplate.id;
    await startPickingSearch(id);
    setDetailId(null);
    setDetailTemplate(null);
    setDetailEditing(false);
    setOrderConfirmOpen(false);
    onClose();
  };

  const removeItemAt = (index: number) => {
    if (!detailTemplate) return;
    const items = detailTemplate.items.filter((_, i) => i !== index);
    const next = { ...detailTemplate, items };
    setDetailTemplate(next);
    upsertTemplate(next);
  };

  const bumpLineQuantity = (index: number, delta: number) => {
    if (!detailTemplate) return;
    const line = detailTemplate.items[index];
    const step = line.step ?? 0.5;
    const minQ = line.minQuantity ?? step;
    let nextQty = line.quantity + delta * step;
    if (delta < 0 && nextQty < minQ - 1e-6) {
      removeItemAt(index);
      return;
    }
    nextQty = Math.max(minQ, nextQty);
    const items = detailTemplate.items.map((it, i) =>
      i === index ? { ...it, quantity: parseFloat(nextQty.toFixed(3)) } : it,
    );
    const next = { ...detailTemplate, items };
    setDetailTemplate(next);
    upsertTemplate(next);
  };

  const emptyList = (
    <View style={styles.emptyBox}>
      <Image
        source={require("@/assets/icons/png/noOrders.png")}
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
    pendingEditAfterDetailLoadRef.current = true;
    setDetailId(id);
  };

  const openOrderConfirmFromList = (item: OrderTemplate) => {
    setOrderConfirmTemplate(item);
    setOrderConfirmOpen(true);
  };

  const renderCard = ({ item }: { item: OrderTemplate }) => {
    const createdAt =
      typeof item.createdAt === "number" ? item.createdAt : item.updatedAt;
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
            {item.items.length}{" "}
            {item.items.length === 1 ? "товар" : "товара(ов)"}
          </ThemedText>
          <ThemedText
            style={styles.cardCreated}
            lightColor="#80818B"
            darkColor="#FBFCFF80"
          >
            Создан: {formatCreatedDate(createdAt)}
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

  const detailEmpty = !detailTemplate?.items?.length;
  const showTemplateBottomPanel =
    !!detailTemplate && !detailEmpty && !detailEditing;

  const detailContent = (
    <Modal
      visible={!!detailId}
      animationType="slide"
      onRequestClose={handleCloseDetail}
      statusBarTranslucent
    >
      <ThemedView
        style={styles.detailRoot}
        lightColor="#EBEDF0"
        darkColor="#040508"
      >
        <ModalHeader
          title={detailTemplate?.name ?? "Шаблон"}
          showBackButton
          onBackPress={handleCloseDetail}
          headerRight={
            <TouchableOpacity
              onPress={toggleEditPencil}
              disabled={!detailTemplate}
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.detailScrollView}
            contentContainerStyle={[
              styles.detailScroll,
              showTemplateBottomPanel && styles.detailScrollWithBottomPanel,
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {detailTemplate && !detailEditing ? (
              <>
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
                    {detailTemplate.companyName?.trim() ||
                      "Компания не выбрана"}
                  </ThemedText>
                </View>
                <View style={[styles.metaRow, styles.metaRowSecond]}>
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
                    {REMINDER_LABELS[detailTemplate.reminderFrequency]}
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

            {detailEditing && detailTemplate ? (
              <>
                <AnimatedTextInput
                  placeholder="Название"
                  value={detailTemplate.name}
                  onChangeText={(t) => updateDetailField("name", t)}
                  multiline={false}
                />
                <View style={{ height: 12 }} />
                <AnimatedTextInput
                  placeholder="Описание"
                  value={detailTemplate.description}
                  onChangeText={(t) => updateDetailField("description", t)}
                  multiline
                  textAlignVertical="top"
                  style={styles.descInputWrap}
                  inputStyle={styles.descInput}
                />
                <TouchableOpacity
                  style={styles.sheetSelectRow}
                  onPress={() => {
                    setCompanyForScene("edit");
                    setCompanyModalVisible(true);
                  }}
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
                      {detailTemplate.companyName || "Выберите"}
                    </ThemedText>
                    <ArrowIconRight />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetSelectRow}
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
                      {REMINDER_LABELS[detailTemplate.reminderFrequency]}
                    </ThemedText>
                    <ArrowIconRight />
                  </View>
                </TouchableOpacity>
              </>
            ) : null}

            {detailEmpty && !detailEditing ? (
              <View style={styles.detailEmpty}>
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
                {detailTemplate?.items.map((line, index) => (
                  <TemplateOrderLineCard
                    key={`${line.productId}-${line.productPurchaseOptionId}-${index}`}
                    line={line}
                    editMode={detailEditing}
                    onDecrease={() => bumpLineQuantity(index, -1)}
                    onIncrease={() => bumpLineQuantity(index, 1)}
                    onRemove={() => removeItemAt(index)}
                  />
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
                />
                <View style={{ height: 10 }} />
                <PrimaryButton
                  title="Найти товары"
                  onPress={() => void leaveToPickSearch()}
                  variant="primary"
                  fullWidth
                />
              </View>
            ) : null}
          </ScrollView>

          {showTemplateBottomPanel && detailTemplate ? (
            <ThemedView
              lightColor="#FFFFFF"
              darkColor="#151516"
              style={styles.bottomPanel}
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
                      lightColor="#1B1B1C"
                      darkColor="#FBFCFF"
                    >
                      {detailTemplate.items.length}{" "}
                      {countGoodsWord(detailTemplate.items.length)}
                    </ThemedText>
                    <ThemedText
                      style={styles.totalQtyLine}
                      lightColor="#80818B"
                      darkColor="#FBFCFF80"
                    >
                      Кол-во:{" "}
                      {detailTemplate.items
                        .reduce((s, i) => s + i.quantity, 0)
                        .toLocaleString("ru-RU", {
                          maximumFractionDigits: 3,
                        })}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText
                  style={styles.totalPrice}
                  lightColor="#203686"
                  darkColor="#4C94FF"
                >
                  {formatMoney(
                    detailTemplate.items.reduce(
                      (s, i) => s + (i.pricePerUnit ?? 0) * i.quantity,
                      0,
                    ),
                  )}{" "}
                  ₽
                </ThemedText>
              </View>
              <PrimaryButton
                title="Сделать заказ по шаблону"
                onPress={() => {
                  setOrderConfirmTemplate(detailTemplate);
                  setOrderConfirmOpen(true);
                }}
                variant="primary"
                fullWidth
              />
              <View style={{ height: 10 }} />
              <PrimaryButton
                title="Добавить товары"
                onPress={() => void leaveToPickCatalog()}
                variant="primary"
                fullWidth
              />
            </ThemedView>
          ) : null}
        </ThemedView>
      </ThemedView>

    </Modal>
  );

  const closeOrderConfirm = () => {
    setOrderConfirmOpen(false);
    setOrderConfirmTemplate(null);
  };

  const reminderPickerValue =
    reminderPickerFor === "create"
      ? cReminder
      : detailTemplate?.reminderFrequency ?? "weekly";

  const onReminderPicked = (v: ReminderFrequency) => {
    if (reminderPickerFor === "create") {
      setCReminder(v);
    } else if (detailTemplate) {
      updateDetailField("reminderFrequency", v);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseAll}
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
            {templates.length === 0 ? (
              emptyList
            ) : (
              <>
                <FlatList
                  data={templates}
                  keyExtractor={(it) => it.id}
                  renderItem={renderCard}
                  contentContainerStyle={styles.listPad}
                  showsVerticalScrollIndicator={false}
                />
                <View style={styles.listFooter}>
                  <PrimaryButton
                    title="+ Создать шаблон"
                    onPress={openCreate}
                    variant="primary"
                    fullWidth
                  />
                </View>
              </>
            )}
          </ThemedView>
        </ThemedView>
      </Modal>

      {detailContent}

      <OrderFromTemplateConfirmModal
        visible={orderConfirmOpen}
        template={orderConfirmTemplate}
        onClose={closeOrderConfirm}
      />

      <ReminderFrequencyPickerModal
        visible={reminderPickerFor !== null}
        value={reminderPickerValue}
        onClose={() => setReminderPickerFor(null)}
        onSelect={onReminderPicked}
      />

      <SnapBottomSheet
        visible={createOpen}
        title="Создание шаблона"
        titleAlign="left"
        onClose={() => {
          setCreateOpen(false);
          setReminderPickerFor(null);
        }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 420 }}
        >
          <AnimatedTextInput
            placeholder="Название"
            value={cName}
            onChangeText={setCName}
            multiline={false}
          />
          <View style={{ height: 12 }} />
          <AnimatedTextInput
            placeholder="Описание"
            value={cDesc}
            onChangeText={setCDesc}
            multiline
            textAlignVertical="top"
            style={styles.descInputWrap}
            inputStyle={styles.descInput}
          />
          <TouchableOpacity
            style={styles.sheetSelectRow}
            onPress={() => {
              setCompanyForScene("create");
              setCompanyModalVisible(true);
            }}
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
                {cCompanyName || "Выберите"}
              </ThemedText>
              <ArrowIconRight />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetSelectRow}
            onPress={() => setReminderPickerFor("create")}
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
                {REMINDER_LABELS[cReminder]}
              </ThemedText>
              <ArrowIconRight />
            </View>
          </TouchableOpacity>
        </ScrollView>
        <View style={{ height: 16 }} />
        <PrimaryButton
          title="Создать шаблон"
          onPress={submitCreate}
          variant="primary"
          fullWidth
        />
      </SnapBottomSheet>

      <CompanySelectModal
        visible={companyModalVisible}
        onClose={() => setCompanyModalVisible(false)}
        companies={me?.companies || []}
        selectedCompanyId={
          companyForScene === "create"
            ? cCompanyId ?? undefined
           : detailTemplate?.companyId ?? undefined
        }
        onSelectCompany={(co) =>
          companyForScene === "create"
            ? selectCompanyCreate(co)
            : selectCompanyEdit(co)
        }
        onAddCompany={() => setCompanyModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  listRoot: { flex: 1 },
  listContent: {
    flex: 1,
    marginTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  listPad: { padding: 16, paddingBottom: 100, gap: 10 },
  listFooter: {
    padding: 16,
    paddingBottom: 28,
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
    flex: 1,
    padding: 24,
    alignItems: "center",
    gap: 16,
    justifyContent: "center",
  },
  emptyImg: { width: 120, height: 120 },
  emptyTitle: { fontSize: 22, fontWeight: "600", textAlign: "center" },
  emptySub: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  detailRoot: { flex: 1 },
  detailBody: {
    flex: 1,
    marginTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  detailScrollView: { flex: 1 },
  detailScroll: { padding: 16, paddingBottom: 40 },
  detailScrollWithBottomPanel: {
    paddingBottom: Platform.OS === "ios" ? 280 : 260,
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
    fontSize: 17,
    fontWeight: "700",
  },
  totalRightCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  totalCounts: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  totalQtyLine: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "right",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "700",
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
