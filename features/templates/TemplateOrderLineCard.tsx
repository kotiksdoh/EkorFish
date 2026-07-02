import { IconRemoveSmall, LikeIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  putFavorite,
  putUnFavorite,
} from "@/features/catalog/catalogSlice";
import { baseUrl } from "@/features/shared/services/axios";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { LoginModal } from "@/features/auth/ui/components/LoginModal";
import type { TemplateLineItem } from "./types";

type Props = {
  line: TemplateLineItem;
  /** Просмотр: как в корзине shop, но без действий. Редактирование: избранное, удаление, количество */
  editMode: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
};

function resolveImageSource(line: TemplateLineItem) {
  const img = line.productImage;
  if (!img || typeof img !== "string") {
    return require("@/assets/icons/png/noImage.png");
  }
  if (img.startsWith("http")) {
    return { uri: img };
  }
  return { uri: `${baseUrl}/${img.replace(/^\//, "")}` };
}

export function TemplateOrderLineCard({
  line,
  editMode,
  onDecrease,
  onIncrease,
  onRemove,
}: Props) {
  const isDarkMode = useColorScheme() === "dark";
  const dispatch = useAppDispatch();
  const [isLiked, setIsLiked] = useState(!!line.isFavorite);
  const [loginVisible, setLoginVisible] = useState(false);

  useEffect(() => {
    setIsLiked(!!line.isFavorite);
  }, [line.isFavorite, line.productId, line.productPurchaseOptionId]);

  const step = line.step ?? 1;
  const minQ = line.minQuantity ?? step;
  const measureShort = line.measureType === "кг" ? "кг" : "шт";
  const unitPrice = line.pricePerUnit ?? 0;
  const total = unitPrice * line.quantity;

  const formatPrice = (price: number) =>
    price.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleFavorite = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      setLoginVisible(true);
      return;
    }
    const id = line.productId;
    if (isLiked) {
      dispatch(putUnFavorite(id)).then(() => setIsLiked(false));
    } else {
      dispatch(putFavorite(id)).then(() => setIsLiked(true));
    }
  };

  return (
    <ThemedView
      darkColor="#151516"
      lightColor="#FFFFFF"
      style={styles.cartItem}
    >
      <View style={styles.imageContainer}>
        <Image
          source={resolveImageSource(line)}
          style={styles.image}
          contentFit="cover"
        />
      </View>

      <View style={styles.dopItemInfo}>
        <View style={styles.itemInfo}>
          <ThemedText
            style={styles.productName}
            numberOfLines={2}
            lightColor="#202022"
            darkColor="#F2F4F7"
          >
            {line.productName}
          </ThemedText>
          <ThemedText
            style={styles.pricePerUnit}
            numberOfLines={1}
            lightColor="#202022"
            darkColor="#F2F4F7"
          >
            {formatPrice(total)} ₽
          </ThemedText>
        </View>

        <View style={styles.priceRow}>
          <ThemedText
            lightColor="#80818B"
            darkColor="#FBFCFF80"
            style={styles.quantityTextKg}
          >
            {formatPrice(unitPrice)}₽ / {measureShort} • {line.quantity}{" "}
            {measureShort}
          </ThemedText>
        </View>

        {line.optionName ? (
          <ThemedText
            style={styles.optionHint}
            lightColor="#80818B"
            darkColor="#FBFCFF80"
            numberOfLines={1}
          >
            {line.optionName}
          </ThemedText>
        ) : null}

        {editMode ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => void handleFavorite()}
            >
              <ThemedView
                style={styles.favoriteTheme}
                lightColor="#F2F4F7"
                darkColor="#202022"
              >
                <LikeIcon isFilled={isLiked} />
              </ThemedView>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={onRemove}>
              <ThemedView
                style={styles.favoriteTheme}
                lightColor="#F2F4F7"
                darkColor="#202022"
              >
                <IconRemoveSmall
                  fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                />
              </ThemedView>
            </TouchableOpacity>

            <ThemedView
              style={[
                styles.quantityControls,
                isDarkMode && { backgroundColor: "#202022" },
              ]}
            >
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={onDecrease}
                disabled={line.quantity <= minQ}
              >
                <ThemedText
                  style={[
                    styles.plusMinus,
                    line.quantity <= minQ && styles.plusMinusDisabled,
                  ]}
                  lightColor="#202022"
                  darkColor="#F2F4F7"
                >
                  -
                </ThemedText>
              </TouchableOpacity>

              <ThemedText
                style={styles.quantityText}
                lightColor="#202022"
                darkColor="#F2F4F7"
              >
                {line.quantity} {measureShort}
              </ThemedText>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={onIncrease}
              >
                <ThemedText style={styles.plusMinus} lightColor="#202022" darkColor="#F2F4F7">
                  +
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </View>
        ) : null}
      </View>

      <LoginModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onLogin={() => setLoginVisible(false)}
        enumFlag={"login"}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  cartItem: {
    flexDirection: "row",
    paddingVertical: 5,
    // paddingHorizontal: 16,
    borderRadius: 12,
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
  dopItemInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
  },
  itemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  pricePerUnit: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 0,
    textAlign: "right",
    minWidth: 80,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "nowrap",
  },
  quantityTextKg: {
    fontSize: 12,
    fontWeight: "500",
  },
  optionHint: {
    fontSize: 11,
    marginTop: 4,
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
    flexShrink: 0,
  },
  favoriteTheme: {
    borderRadius: 8,
    padding: 3,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  quantityControls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 6,
    marginLeft: 4,
    minWidth: 0,
  },
  quantityButton: {
    paddingHorizontal: 6,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  plusMinus: {
    fontSize: 16,
  },
  plusMinusDisabled: {
    opacity: 0.35,
  },
  quantityText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    minWidth: 0,
    textAlign: "center",
  },
});
