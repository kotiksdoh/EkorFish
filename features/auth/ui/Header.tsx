import {
  ArrowIconLeft,
  CloseIcon,
  IconSearchNew,
  IconShare,
  LikeIcon,
} from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { putFavorite, putUnFavorite } from "@/features/catalog/catalogSlice";
import { SearchScreenWithHistory } from "@/features/home/ui/screens/SearchScreenWithHistory";
import { useAppDispatch } from "@/store/hooks";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Share, StyleSheet, TouchableOpacity, View } from "react-native";
interface ModalHeaderProps {
  title?: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  content?: any;
  showCloseButton?: boolean;
  isProduct?: boolean;
  productId?: string;
  isFavorite?: boolean;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onBackPress,
  showBackButton = true,
  content,
  showCloseButton,
  isProduct = false,
  productId,
  isFavorite: initialIsFavorite,
}) => {
  const [isLiked, setIsLiked] = useState(initialIsFavorite);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    setIsLiked(initialIsFavorite);
  }, [initialIsFavorite]);

  const handleLikePress = () => {
    if (!productId) return;

    if (isLiked) {
      dispatch(putUnFavorite(productId)).then(() => {
        setIsLiked(false);
      });
    } else {
      dispatch(putFavorite(productId)).then(() => {
        setIsLiked(true);
      });
    }
  };

  const truncateTitle = (text: string | undefined, maxLength: number = 25) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  const [showSearch, setShowSearch] = useState(false);

  const handleSearchPress = () => {
    setShowSearch(true);
  };
  const handleSearchClose = () => {
    setShowSearch(false);
  };
  const handleSearchSubmit = (query: string) => {
    // Переходим на экран каталога с поиском
    //@ts-ignore
    router.push(
      `dashboard/${encodeURIComponent("fsfs")}?catalogId=${" "}&catalogName=${encodeURIComponent(`${query}`)}&children=${encodeURIComponent("")}&search=${encodeURIComponent(`${query}`)}`,
    );
  };
  const handleShare = async () => {
    if (!productId) return;

    try {
      const productUrl = Linking.createURL(`/product/${productId}`, {
        queryParams: {
          productName: title, // или другое название товара
        },
      });

      const result = await Share.share({
        message: `Посмотрите товар: ${title || "Товар"}\n\n${productUrl}`,
        title: "Поделиться товаром",
        url: productUrl, // для iOS
      });

      if (result.action === Share.sharedAction) {
        console.log("Поделились товаром:", productId);
      }
    } catch (error) {}
  };

  console.log("showCloseButton", showCloseButton);
  console.log("isProduct", isProduct);
  console.log("!showCloseButton || !isProduct", !showCloseButton || !isProduct);
  return (
    <>
      <ThemedView
        lightColor={"#FFFFFF"}
        darkColor="#151516"
        style={headerStyles.allCont}
      >
        {title || showBackButton || showCloseButton || isProduct ? (
          <ThemedView
            lightColor={"#FFFFFF"}
            darkColor="#151516"
            style={headerStyles.container}
          >
            {showBackButton && (
              <TouchableOpacity
                style={headerStyles.backButton}
                onPress={onBackPress}
              >
                {/* <ThemedText style={headerStyles.backButtonText}>‹</ThemedText> */}
                <ArrowIconLeft />
              </TouchableOpacity>
            )}
            <ThemedText
              style={headerStyles.title}
              lightColor={"#1B1B1C"}
              numberOfLines={1}
            >
              {truncateTitle(title)}
            </ThemedText>
            {isProduct && (
              <TouchableOpacity
                style={headerStyles.likeIcon}
                onPress={handleLikePress}
                activeOpacity={0.7}
              >
                <LikeIcon isFilled={isLiked} />
              </TouchableOpacity>
            )}
            {isProduct && (
              <TouchableOpacity
                style={headerStyles.searchIcon}
                onPress={handleSearchPress}
                activeOpacity={0.7}
              >
                <IconSearchNew />
              </TouchableOpacity>
            )}
            {isProduct && (
              <TouchableOpacity
                style={headerStyles.shareIcon}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <IconShare />
              </TouchableOpacity>
            )}
            {isProduct && (
              <TouchableOpacity
                style={headerStyles.likeIcon}
                onPress={handleLikePress}
                activeOpacity={0.7}
              >
                <LikeIcon isFilled={isLiked} />
              </TouchableOpacity>
            )}
            {showCloseButton && (
              <TouchableOpacity
                style={headerStyles.closeIcon}
                onPress={onBackPress}
              >
                <CloseIcon />
              </TouchableOpacity>
            )}
          </ThemedView>
        ) : null}
        {!showCloseButton || isProduct ? (
          <View
            style={
              ((!title && !isProduct) || !showBackButton) &&
              headerStyles.containerSub
            }
          >
            {content ? content : null}
          </View>
        ) : null}
      </ThemedView>
      <SearchScreenWithHistory
        visible={showSearch}
        onClose={handleSearchClose}
        onSearch={handleSearchSubmit}
      />
    </>
  );
};

const headerStyles = StyleSheet.create({
  allCont: {
    overflow: "hidden",
    width: "100%",
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
    zIndex: 1,
    elevation: 1,
  },
  container: {
    width: "100%",
    paddingTop: 66,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
    justifyContent: "flex-end",
    paddingBottom: 17,
    paddingHorizontal: 20,
    position: "relative",
    alignItems: "center",
    overflow: "hidden",
  },
  containerSub: {
    paddingTop: 66,
    paddingBottom: 17,
  },
  backButton: {
    position: "absolute",
    left: 20,
    bottom: 14,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    position: "absolute",
    right: 20,
    bottom: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    right: 100,
    bottom: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  shareIcon: {
    position: "absolute",
    right: 60,
    bottom: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  likeIcon: {
    position: "absolute",
    right: 20,
    bottom: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 32,
    fontWeight: "300",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
});
