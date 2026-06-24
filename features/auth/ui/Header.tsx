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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { ReactNode, useEffect, useState } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LoginModal } from "./components/LoginModal";
interface ModalHeaderProps {
  title?: string;
  subTitle?: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  content?: any;
  showCloseButton?: boolean;
  isProduct?: boolean;
  productId?: string;
  isFavorite?: boolean;
  /** Произвольная кнопка справа (например, карандаш редактирования) */
  headerRight?: ReactNode;
  /** Контент под строкой заголовка, но над `content` (например баннер режима шаблона) */
  belowTitleRow?: ReactNode;
  /** Компактные отступы для экрана результатов поиска */
  compactSearchLayout?: boolean;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subTitle,
  onBackPress,
  showBackButton = true,
  content,
  showCloseButton,
  isProduct = false,
  productId,
  isFavorite: initialIsFavorite,
  headerRight,
  belowTitleRow,
  compactSearchLayout = false,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [isLiked, setIsLiked] = useState(initialIsFavorite);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    setIsLiked(initialIsFavorite);
  }, [initialIsFavorite]);

  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const handleLoginPress = () => {
    setLoginModalVisible(true);
  };

  const handleLogin = (phoneNumber: string) => {
    console.log("Login with:", phoneNumber);
    setLoginModalVisible(false);
  };
  const handleLikePress = async () => {
    if (!productId) return;
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      handleLoginPress();
      return; // Выходим, если нет токена
    }
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
      `dashboard/${encodeURIComponent("fsfs")}?catalogId=${" "}&catalogName=${encodeURIComponent(`${query}`)}&children=${encodeURIComponent("")}&search=${encodeURIComponent(`${query}`)}&isPromo=false&fromSearchScreen=true`,
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
  const showHeaderTitleRow = !!(
    title ||
    showBackButton ||
    showCloseButton ||
    isProduct
  );
  return (
    <>
      <ThemedView
        lightColor={"#FFFFFF"}
        darkColor="#151516"
        style={headerStyles.allCont}
      >
        {showHeaderTitleRow ? (
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
                <ArrowIconLeft color={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
              </TouchableOpacity>
            )}
            <ThemedText
              style={headerStyles.title}
              lightColor={"#1B1B1C"}
              numberOfLines={1}
            >
              {truncateTitle(title)}
            </ThemedText>
            {subTitle ? (
              <ThemedText
                style={headerStyles.subTitle}
                lightColor={"#80818B"}
                darkColor={"#FBFCFF80"}
                numberOfLines={1}
              >
                {subTitle}
              </ThemedText>
            ) : null}
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
                <IconSearchNew color={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
              </TouchableOpacity>
            )}
            {isProduct && (
              <TouchableOpacity
                style={headerStyles.shareIcon}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <IconShare color={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
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
            {headerRight ? (
              <View style={headerStyles.headerRight}>{headerRight}</View>
            ) : null}
            {belowTitleRow ? (
              <View
                style={[
                  headerStyles.belowTitleSlot,
                  headerStyles.belowTitleBleed,
                ]}
              >
                {belowTitleRow}
              </View>
            ) : null}
          </ThemedView>
        ) : null}
        {belowTitleRow && !showHeaderTitleRow ? (
          <View style={headerStyles.belowTitleSlot}>{belowTitleRow}</View>
        ) : null}
        {!showCloseButton || isProduct ? (
          <View
            style={[
              ((!title && !isProduct) || !showBackButton) &&
                headerStyles.containerSub,
              compactSearchLayout && headerStyles.containerSubCompact,
            ]}
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
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onLogin={handleLogin}
        enumFlag={"login"}
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
  containerSubCompact: {
    paddingBottom: 14,
  },
  backButton: {
    position: "absolute",
    left: 20,
    bottom: 10,
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
  headerRight: {
    position: "absolute",
    right: 20,
    bottom: 10,
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  belowTitleSlot: {
    width: "100%",
    alignSelf: "stretch",
  },
  /** Компенсирует paddingHorizontal у container, чтобы баннер был на всю ширину шапки */
  belowTitleBleed: {
    marginHorizontal: -20,
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
  subTitle:{
    fontSize: 12,
    fontWeight: '500',
  }
});
