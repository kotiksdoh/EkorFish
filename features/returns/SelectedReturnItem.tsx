// components/SelectedReturnItem.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";
import React, { memo } from "react";
import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import { baseUrl } from "../shared/services/axios";

interface SelectedReturnItemProps {
  item: {
    id: string;
    productName: string;
    productImage?: string;
    price: number;
    returnQuantity: number;
    measureType: string;
    reason?: number;
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

  const hasReason = item.reason && item.reason > 0;

  return (
    <ThemedView
      darkColor="#151516"
      lightColor="#FFFFFF"
      style={styles.container}
    >
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} contentFit="cover" />
      </View>

      <View style={styles.infoContainer}>
        <ThemedText
          style={styles.productName}
          numberOfLines={2}
          lightColor="#202022"
          darkColor="#F2F4F7"
        >
          {item.productName}
        </ThemedText>

        <View style={styles.priceRow}>
          <ThemedText
            lightColor="#80818B"
            darkColor="#FBFCFF80"
            style={styles.priceText}
          >
            {formatPrice(item.price)} ₽ × {item.returnQuantity} {item.measureType === "килограмм" ? "кг" : "шт"}
          </ThemedText>
          <ThemedText
            style={styles.totalPrice}
            lightColor="#202022"
            darkColor="#F2F4F7"
          >
            {formatPrice(item.price * item.returnQuantity)} ₽
          </ThemedText>
        </View>

        {hasReason && item.reasonName && (
          <ThemedText
            style={styles.selectedReason}
            lightColor="#203686"
            darkColor="#4C94FF"
          >
            Причина: {item.reasonName}
            {item.comment ? ` (${item.comment})` : ''}
          </ThemedText>
        )}

        <TouchableOpacity
          style={[
            styles.reasonButton,
            hasReason && styles.reasonButtonSelected,
            isDark && styles.reasonButtonDark,
          ]}
          onPress={onSelectReason}
        >
          <ThemedText
            style={[
              styles.reasonButtonText,
              hasReason && styles.reasonButtonTextSelected,
            ]}
            lightColor={hasReason ? "#203686" : "#80818B"}
            darkColor={hasReason ? "#4C94FF" : "#FBFCFF80"}
          >
            {hasReason ? "Редактировать причину" : "Выбрать причину"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  imageContainer: {
    width: 80,
    height: 80,
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
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectedReason: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  reasonButton: {
    backgroundColor: "#F2F4F7",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  reasonButtonDark: {
    backgroundColor: "#202022",
  },
  reasonButtonSelected: {
    backgroundColor: "#E1F0FF",
    borderColor: "#203686",
  },
  reasonButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  reasonButtonTextSelected: {
    color: "#203686",
  },
});