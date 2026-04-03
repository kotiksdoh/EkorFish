import { LikeIcon, TrashIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Image } from "expo-image";
import React, { memo, useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import { baseUrl } from "../shared/services/axios";
import { formatDate } from "../shared/services/utils";
import { CustomCheckbox } from "../shared/ui/components/CustomCheckBox";

interface ReturnsOrderCardProps {
  returnsOrder: any;
  statuses: any[];
  fullWidth?: boolean;
  onPress?: () => void;
}

// Мемоизированный компонент для товара
const CartItemComponent = memo(({
  item,
  isSelected,
  onToggleSelect,
  onUpdateQuantity,
  onRemove,
  returnQuantity,
  isReturnable,
}: {
  item: any;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdateQuantity: (newQuantity: number) => void;
  onRemove: () => void;
  returnQuantity: number;
  isReturnable: boolean;
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [isFavorite, setIsFavorite] = useState(item.isFavorite);

  const handleToggleFavorite = useCallback(async () => {
    console.error("Error toggling favorite:");
  }, []);

  const formatPrice = useCallback((price: number) => {
    return price.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const handleDecrement = useCallback(() => {
    onUpdateQuantity(returnQuantity - item.purchaseOptionStep);
  }, [returnQuantity, item.purchaseOptionStep, onUpdateQuantity]);

  const handleIncrement = useCallback(() => {
    onUpdateQuantity(returnQuantity + item.purchaseOptionStep);
  }, [returnQuantity, item.purchaseOptionStep, onUpdateQuantity]);

  // Мемоизируем URL изображения
  const imageSource = React.useMemo(() => {
    if (item.productImage) {
      return { uri: `${baseUrl}/${item.productImage}` };
    }
    return require("@/assets/icons/png/noImage.png");
  }, [item.productImage]);

  return (
    <ThemedView
      darkColor="#151516"
      lightColor="#FFFFFF"
      style={styles.cartItem}
    >
      <View style={styles.imageContainer}>
        <ThemedView
          darkColor="#151516"
          lightColor="#FFFFFF"
          style={styles.checkboxPhoto}
        >
          <CustomCheckbox
            style={styles.checkboxPhoto}
            value={isSelected}
            onValueChange={onToggleSelect}
            lightColor={"#F2F4F7"}
            darkColor={"#202022"}
            disabled={!isReturnable}
          />
        </ThemedView>
        <Image
          source={imageSource}
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
            {item.productName}
          </ThemedText>

          <ThemedText
            style={styles.pricePerUnit}
            numberOfLines={1}
            lightColor="#202022"
            darkColor="#F2F4F7"
          >
            {formatPrice(item.totalPrice)} ₽
          </ThemedText>
        </View>

        <View style={styles.priceRow}>
          <ThemedText
            lightColor={"#80818B"}
            darkColor="#FBFCFF80"
            style={styles.quantityTextKg}
          >
            {item.price}₽ / {item.measureType === "килограмм" ? "кг" : "шт"} •{" "}
            {item.quantity} {item.measureType === "килограмм" ? "кг" : "шт"}
          </ThemedText>
        </View>

        {item?.stockInfo ? (
          <ThemedView
            lightColor={"#1B1B1C"}
            darkColor={"#1B1B1C"}
            style={styles.stockInfoContainer}
          >
            <ThemedText
              lightColor="#202022"
              darkColor="#F2F4F7"
              style={styles.stockInfoText}
            >
              {item.stockInfo}
            </ThemedText>
          </ThemedView>
        ) : null}

        <View style={styles.priceRow}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            disabled={!isReturnable}
          >
            <ThemedView
              style={styles.favoriteTheme}
              lightColor="#F2F4F7"
              darkColor="#202022"
            >
              <LikeIcon isFilled={isFavorite} />
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onRemove}
            disabled={!isReturnable}
          >
            <ThemedView
              style={styles.favoriteTheme}
              lightColor="#F2F4F7"
              darkColor="#202022"
            >
              <TrashIcon
                stroke={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
              />
            </ThemedView>
          </TouchableOpacity>

          <ThemedView
            style={[
              styles.quantityControls,
              isDarkMode && {
                backgroundColor: "#202022",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleDecrement}
              disabled={!isReturnable}
            >
              <ThemedText
                style={styles.plusMinus}
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
              {returnQuantity} {item.measureType === "килограмм" ? "кг" : "шт"} 
            </ThemedText>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleIncrement}
              disabled={!isReturnable}
            >
              <ThemedText
                style={styles.plusMinus}
                lightColor="#202022"
                darkColor="#F2F4F7"
              >
                +
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </View>
    </ThemedView>
  );
}, (prevProps, nextProps) => {
  // Кастомная функция сравнения для memo
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.returnQuantity === nextProps.returnQuantity &&
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.totalPrice === nextProps.item.totalPrice &&
    prevProps.isReturnable === nextProps.isReturnable
  );
});

const ReturnsOrderCard: React.FC<ReturnsOrderCardProps> = ({
  returnsOrder,
  fullWidth = false,
  onPress,
  statuses,
}) => {
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";
  const dispatch = useAppDispatch();
  
  const returnRequests = useAppSelector((state) => state.catalog.returnRequests);
  
  // Мемоизируем получение количества возврата для конкретного товара
  const getReturnQuantity = useCallback((orderProductId: string): number => {
    const orderInRequest = returnRequests.orders.find(
      (order) => order.orderId === returnsOrder.orderId
    );
    if (orderInRequest) {
      const item = orderInRequest.items.find(
        (item) => item.orderProductId === orderProductId
      );
      return item?.returnQuantity || 0;
    }
    return 0;
  }, [returnRequests, returnsOrder.orderId]);

  const toggleSelectItem = useCallback((itemId: string, quantity: number, orderProductId: string) => {
    const currentReturnQuantity = getReturnQuantity(orderProductId);
    
    if (currentReturnQuantity > 0) {
      // Убираем выделение
      dispatch({
        type: "catalog/updateReturnRequestItem",
        payload: {
          orderId: returnsOrder.orderId,
          orderProductId: orderProductId,
          returnQuantity: 0
        }
      });
    } else {
      // Добавляем выделение
      dispatch({
        type: "catalog/updateReturnRequestItem",
        payload: {
          orderId: returnsOrder.orderId,
          orderProductId: orderProductId,
          returnQuantity: quantity
        }
      });
    }
  }, [dispatch, returnsOrder.orderId, getReturnQuantity]);
  
  const updateReturnQuantity = useCallback((orderProductId: string, newQuantity: number, maxQuantity: number) => {
    // Ограничиваем количество
    let finalQuantity = newQuantity;
    if (finalQuantity < 0) finalQuantity = 0;
    if (finalQuantity > maxQuantity) finalQuantity = maxQuantity;
    
    dispatch({
      type: "catalog/updateReturnRequestItem",
      payload: {
        orderId: returnsOrder.orderId,
        orderProductId: orderProductId,
        returnQuantity: finalQuantity
      }
    });
  }, [dispatch, returnsOrder.orderId]);
  
  const CardWrapper = onPress && returnsOrder.isReturnable ? TouchableOpacity : View;

  // Мемоизируем рендер списка товаров
  const renderProducts = useCallback(() => {
    return returnsOrder.products.map((item: any) => {
      const returnQuantity = getReturnQuantity(item.id);
      const isSelected = returnQuantity > 0;
      
      return (
        <CartItemComponent
          key={item.id}
          item={item}
          isSelected={isSelected}
          onToggleSelect={() => toggleSelectItem(item.id, item.quantity, item.id)}
          onUpdateQuantity={(newQuantity: number) =>
            updateReturnQuantity(item.id, newQuantity, item.quantity)
          }
          onRemove={() => updateReturnQuantity(item.id, 0, item.quantity)}
          returnQuantity={returnQuantity}
          isReturnable={returnsOrder.isReturnable}
        />
      );
    });
  }, [returnsOrder.products, getReturnQuantity, toggleSelectItem, updateReturnQuantity]);

  return (
    <CardWrapper
      style={[
        styles.card,
        fullWidth && styles.fullWidthCard,
        isDark && styles.darkCard,
      ]}
      onPress={returnsOrder.isReturnable ? onPress : undefined}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <ThemedText style={styles.returnNumber}>
          Заказ № {returnsOrder.orderId}
        </ThemedText>
        <ThemedText lightColor="#80818B" darkColor="#FBFCFF80" style={styles.receivedAt}>
          {returnsOrder.receivedAt ? `Доставлен ${formatDate(returnsOrder.receivedAt)}` : `Еще не доставлен`}
        </ThemedText>
      </View>

      <View style={[styles.cardBody, !returnsOrder.isReturnable && { opacity: 0.5 }]}>
        {renderProducts()}
      </View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  darkCard: {
    backgroundColor: "#202022",
  },
  fullWidthCard: {
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  returnNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  receivedAt: {
    fontWeight: "500",
    fontSize: 14,
  },
  cardBody: {},
  cartItem: {
    flexDirection: "row",
    padding: 16,
  },
  checkboxPhoto: {
    padding: 2,
    position: "absolute",
    top: 2,
    left: 10,
    borderRadius: 10,
    minWidth: 6,
    maxWidth: 6,
    width: 6,
    height: 6,
    zIndex: 1,
    alignItems: "center",
  },
  imageContainer: {
    width: 74,
    height: 55,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dopItemInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  itemInfo: {
    flex: 1,
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
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },
  favoriteTheme: {
    borderRadius: 8,
    padding: 3,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 6,
    marginLeft: 4,
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
  quantityTextKg: {
    fontSize: 12,
    fontWeight: "500",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "500",
    minWidth: 120,
    textAlign: "center",
  },
  stockInfoContainer: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    marginVertical: 8,
  },
  stockInfoText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default ReturnsOrderCard;