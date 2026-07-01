// components/SelectedReturnItem.tsx
import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "expo-image";
import React, { memo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { baseUrl } from "../shared/services/axios";
import type { ReturnReasonId } from "./returnReason";
import { isReturnReasonSelected } from "./returnReason";

interface SelectedReturnItemProps {
  item: {
    id: string;
    productName: string;
    productImage?: string;
    price: number;
    returnQuantity: number;
    measureType: string;
    reason?: ReturnReasonId;
    reasonName?: string;
    comment?: string;
  };
  onSelectReason: () => void;
}

export const SelectedReturnItem = memo(({ item, onSelectReason }: SelectedReturnItemProps) => {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const formatPrice = (price: number) => {
    return price.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const imageSource = item.productImage
    ? { uri: `${baseUrl}/${item.productImage}` }
    : require("@/assets/icons/png/noImage.png");

  const hasReason = isReturnReasonSelected(item.reason);

  return (
    <ThemedView
      darkColor="#151516"
      lightColor="#FFFFFF"
      style={styles.container}
    >
      <View style={styles.blockContainer}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} contentFit="cover" />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <ThemedText
            style={styles.productName}
            numberOfLines={2}
            lightColor="#202022"
            darkColor="#F2F4F7"
          >
            {item.productName}
          </ThemedText>
          <ThemedText
            style={styles.totalPrice}
            lightColor="#202022"
            darkColor="#F2F4F7"
          >
            {formatPrice(item.price * item.returnQuantity)} ₽
          </ThemedText>
        </View>
      </View>
      </View>
        {hasReason && item.reasonName && (
          <ThemedView
            style={[
              styles.reasonSection,
              !isDark && styles.reasonSectionLight,
              isDark && styles.reasonSectionDark,
            ]}
          >
            <View style={styles.reasonContent}>
              <ThemedText
                style={styles.selectedReason}
                lightColor="#1B1B1C"
                darkColor="#F2F4F7"
              >
                {item.reasonName}
                {item.comment ? ` (${item.comment})` : ''}
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[
                styles.reasonButton,
                styles.reasonButtonSelectedActive,
              ]}
              onPress={onSelectReason}
            >
              <ThemedText
                style={styles.reasonButtonTextSelectedActive}
                lightColor="#FBFCFF"
                darkColor="#FBFCFF"
              >
                Редактировать
              </ThemedText>
              <ArrowIconRight stroke="#FBFCFF"/>
            </TouchableOpacity>
          </ThemedView>
        )}

        {!hasReason && (
          <TouchableOpacity
            style={[
              styles.reasonButtonEmpty,
              isDark && styles.reasonButtonEmptyDark,
            ]}
            onPress={onSelectReason}
          >
            <ThemedText
              style={styles.reasonButtonText}
              lightColor="#80818B"
              darkColor="#F2F4F7"
            >
              Выбрать причину
            </ThemedText>
            <ArrowIconRight />
          </TouchableOpacity>
        )}
      
     
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  blockContainer: {
    flexDirection: "row",
  },
  
  imageContainer: {
    width: 74,
    height: 55,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
    flex: 1,
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 0,
  },
  reasonSection: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  reasonSectionLight: {
    backgroundColor: "#F2F4F7",
  },
  reasonSectionDark: {
    backgroundColor: "#202022",
  },
  reasonContent: {
    flex: 1,
  },
  selectedReason: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 16,
  },
  reasonButtonEmpty: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
    gap: 6,
    minWidth: "50%",
    alignSelf: "flex-end",
  },
  reasonButtonEmptyDark: {
    backgroundColor: "#202022",
  },
  reasonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  reasonButtonSelectedActive: {
    backgroundColor: "#101013",
    minWidth: "50%",
  },
  reasonButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  reasonButtonTextSelectedActive: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    fontSize: 14,
    fontWeight: "500",
    color: "#FBFCFF",
  },
});