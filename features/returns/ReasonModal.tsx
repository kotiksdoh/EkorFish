// components/ReasonModal.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { baseUrl } from "../shared/services/axios";
import type { ReturnReasonId } from "./returnReason";
import { isSameReturnReason } from "./returnReason";

export interface ReasonPickerProduct {
  productName?: string;
  productImage?: string;
  price?: number;
  returnQuantity?: number;
  measureType?: string;
}

export interface ReasonPickerProps {
  onClose: () => void;
  onSelect: (reasonId: ReturnReasonId, comment: string) => void;
  selectedReasonId?: ReturnReasonId;
  selectedComment?: string;
  reasons: Array<{ reason: ReturnReasonId; name: string }>;
  product?: ReasonPickerProduct;
}

/** Контент выбора причины (без Modal — для inline-оверлея на iOS). */
export function ReasonPickerContent({
  onClose,
  onSelect,
  selectedReasonId,
  selectedComment,
  reasons,
  product,
}: ReasonPickerProps) {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";
  const [selectedReason, setSelectedReason] = useState<ReturnReasonId | undefined>(
    undefined,
  );
  const [comment, setComment] = useState(selectedComment || "");

  useEffect(() => {
    setSelectedReason(selectedReasonId);
    setComment(selectedComment || "");
  }, [selectedReasonId, selectedComment]);

  const handleSelect = () => {
    if (selectedReason !== undefined) {
      onSelect(selectedReason, comment);
    }
  };

  const handleClose = () => {
    setSelectedReason(undefined);
    setComment("");
    onClose();
  };

  return (
    <ThemedView
      lightColor="#EBEDF0"
      darkColor="#040508"
      style={styles.modalContainer}
    >
      <ModalHeader
        title="Причина возврата"
        showBackButton
        onBackPress={handleClose}
      />

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {product ? (
          <ThemedView
            darkColor="#151516"
            lightColor="#FFFFFF"
            style={[styles.productCard, { marginBottom: 8 }]}
          >
            <View style={styles.productCardInner}>
              <View style={styles.productImageContainer}>
                <Image
                  source={
                    product.productImage
                      ? { uri: `${baseUrl}/${product.productImage}` }
                      : require("@/assets/icons/png/noImage.png")
                  }
                  style={styles.productImage}
                  contentFit="cover"
                />
              </View>
              <View style={styles.productCardContent}>
                <ThemedText
                  style={styles.productCardName}
                  numberOfLines={2}
                  lightColor="#202022"
                  darkColor="#F2F4F7"
                >
                  {product.productName}
                </ThemedText>
                <ThemedText
                  style={styles.productCardPrice}
                  lightColor="#202022"
                  darkColor="#F2F4F7"
                >
                  {product.price && product.returnQuantity
                    ? `${(product.price * product.returnQuantity).toLocaleString("ru-RU", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} ₽`
                    : ""}
                </ThemedText>
              </View>
            </View>
          </ThemedView>
        ) : null}

        <ThemedView
          darkColor="#151516"
          lightColor="#FFFFFF"
          style={[styles.sectionContainer, { marginBottom: 8 }]}
        >
          <ThemedText
            style={styles.sectionTitle}
            lightColor="#202022"
            darkColor="#F2F4F7"
          >
            Выберите причину возврата
          </ThemedText>
          <View style={styles.reasonsList}>
            {reasons?.map((reason) => {
              const isReasonSelected = isSameReturnReason(
                selectedReason,
                reason.reason,
              );

              return (
              <TouchableOpacity
                key={String(reason.reason)}
                style={[styles.reasonItem, isDark && styles.reasonItemDark]}
                onPress={() => setSelectedReason(reason.reason)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    isReasonSelected && styles.radioOuterSelected,
                    isDark &&
                      isReasonSelected &&
                      styles.radioOuterSelectedDark,
                  ]}
                >
                  {isReasonSelected ? (
                    <View style={styles.radioInner} />
                  ) : null}
                </View>
                <ThemedText
                  style={[
                    styles.reasonName,
                    isDark && styles.reasonNameDark,
                    isReasonSelected && styles.reasonNameSelected,
                    isDark &&
                      isReasonSelected &&
                      styles.reasonNameSelectedDark,
                  ]}
                  lightColor="#202022"
                  darkColor="#F2F4F7"
                >
                  {reason.name}
                </ThemedText>
              </TouchableOpacity>
            );
            })}
          </View>
        </ThemedView>

        <ThemedView
          darkColor="#151516"
          lightColor="#FFFFFF"
          style={styles.sectionContainer}
        >
          <ThemedText
            style={styles.sectionTitle}
            lightColor="#202022"
            darkColor="#F2F4F7"
          >
            Опишите проблему
          </ThemedText>
          <TextInput
            style={[styles.commentInput, isDark && styles.commentInputDark]}
            placeholder="Опишите, что не так с товаром"
            placeholderTextColor="#80818B"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </ThemedView>
      </ScrollView>

      <ThemedView
        darkColor="#151516"
        lightColor="#FFFFFF"
        style={[
          styles.bottomPanel,
          { paddingBottom: (Platform.OS === "ios" ? 34 : 16) + insets.bottom },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.submitButton,
            selectedReason === undefined && styles.submitButtonDisabled,
          ]}
          disabled={selectedReason === undefined}
          onPress={handleSelect}
        >
          <ThemedText style={styles.submitButtonText}>Выбрать</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

/** Отдельный Modal (только если нет родительской modal). */
export function ReasonModal({
  visible,
  ...props
}: ReasonPickerProps & { visible: boolean }) {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={props.onClose}
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : "fullScreen"}
      statusBarTranslucent
    >
      <ReasonPickerContent {...props} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingTop: 8,
  },
  scrollContentContainer: {
    paddingBottom: 80,
  },
  productCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    // marginHorizontal: 16,
  },
  productCardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  productImageContainer: {
    width: 74,
    height: 55,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  productCardName: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
    flex: 1,
  },
  productCardPrice: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 0,
  },
  sectionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    // marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  reasonsList: {
    gap: 10,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reasonItemDark: {
    borderBottomColor: "#323235",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8DADE",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBFCFF",
    marginBottom: 10,
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
  reasonName: {
    fontSize: 14,
    fontWeight: "500",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    flex: 1,
    paddingBottom: 10,
  },
  reasonNameDark: {
    borderBottomColor: "#252527",
  },
  reasonNameSelected: {
    color: "#203686",
  },
  reasonNameSelectedDark: {
    color: "#FFFFFF",
  },
  commentInput: {
    backgroundColor: "#03051E08",
    borderRadius: 12,
    borderWidth: 0.1,
    borderColor: "transparent",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    fontWeight: "500",
    textAlignVertical: "top",
    minHeight: 100,
  },
  commentInputDark: {
    backgroundColor: "#ECEFFA0D",
    color: "#F2F4F7",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: "#203686",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
