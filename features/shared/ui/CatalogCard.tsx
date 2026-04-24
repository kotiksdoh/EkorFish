import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getProductList } from "@/features/catalog/catalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface CatalogCardProps {
  id: number;
  img?: any;
  name: string;
  children?: any[];
}

const { width: screenWidth } = Dimensions.get("window");
const PADDING_HORIZONTAL = 16;
const GAP = 12;
const NUM_COLUMNS = 3;

const cardWidth =
  (screenWidth - PADDING_HORIZONTAL * 2 - GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

const PLACEHOLDER_IMAGE = require("@/assets/icons/png/noImage.png");

export const CatalogCard: React.FC<CatalogCardProps> = ({
  id,
  img,
  name,
  children,
}) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const imageLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const me = useAppSelector((state) => state.auth.me);
  const handlePress = () => {
    console.log("Navigating to catalog-detail with:", { id, name, children });
    if (id && name) {
      // Преобразуем children в строку для передачи через URL
      const childrenString = children ? JSON.stringify(children) : "[]";

      dispatch(
        getProductList({
          params: {
            isFavorite: false,
            categoryId: id, // Раскомментируйте
            offset: 0,
            count: 10,
            storageId: me?.storageId,
          },
        }),
      );

      // Передаем children как параметр
      //@ts-ignore
      router.push(
        `dashboard/${encodeURIComponent(name)}?catalogId=${id}&catalogName=${encodeURIComponent(name)}&children=${encodeURIComponent(childrenString)}&isPromo=false`,
      );
    }
  };

  useEffect(() => {
    return () => {
      if (imageLoadTimeoutRef.current) {
        clearTimeout(imageLoadTimeoutRef.current);
      }
    };
  }, []);

  const isValidImageUrl = useCallback((url: string): boolean => {
    if (!url || typeof url !== "string") return false;
    return url.length > 10 && !url.endsWith("/") && url.startsWith("http");
  }, []);

  const imageSource = useMemo(() => {
    if (!img || (typeof img === "string" && !isValidImageUrl(img))) {
      return PLACEHOLDER_IMAGE;
    }
    if (typeof img === "string") {
      return { uri: img };
    }
    return img;
  }, [img, isValidImageUrl]);

  const showPlaceholder =
    !img ||
    imageError ||
    (typeof img === "string" && !isValidImageUrl(img));

  useEffect(() => {
    setImageError(false);
    if (!img || (typeof img === "string" && !isValidImageUrl(img as string))) {
      setIsImageLoading(false);
    } else {
      setIsImageLoading(true);
    }
  }, [img, isValidImageUrl]);

  const handleImageLoadStart = useCallback(() => {
    setIsImageLoading(true);
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
    }
    imageLoadTimeoutRef.current = setTimeout(() => {
      setIsImageLoading((loading) => {
        if (loading) {
          setImageError(true);
          return false;
        }
        return loading;
      });
    }, 10000);
  }, [img]);

  const handleImageLoadEnd = useCallback(() => {
    setIsImageLoading(false);
    setImageError(false);
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
    }
  }, []);

  const handleImageError = useCallback(() => {
    setIsImageLoading(false);
    setImageError(true);
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
    }
  }, [img]);
  
  return (
    // <Link
    //   href={`/dashboard/${encodeURIComponent(name)}?catalogId=${id}&catalogName=${encodeURIComponent(name)}`}
    // >
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.touchableContainer}
    >
      <ThemedView
        lightColor="#FFFFFF"
        darkColor="#151516"
        style={styles.container}
      >
        <View style={styles.textContainer}>
          <ThemedText
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
            style={styles.name}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {name || "Категория"}
          </ThemedText>
        </View>

        <View style={styles.imageWrapper}>
          <View style={styles.imageContainer}>
            <Image
              key={
                showPlaceholder || typeof img !== "string"
                  ? "placeholder-or-local"
                  : img
              }
              source={showPlaceholder ? PLACEHOLDER_IMAGE : imageSource}
              style={styles.image}
              resizeMode="cover"
              onLoadStart={!showPlaceholder ? handleImageLoadStart : undefined}
              onLoadEnd={!showPlaceholder ? handleImageLoadEnd : undefined}
              onError={!showPlaceholder ? handleImageError : undefined}
            />
            {!showPlaceholder && isImageLoading && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.loadingOverlay,
                ]}
              >
                <ActivityIndicator size="small" color="#CCCCCC" />
              </View>
            )}
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
    // {/* </Link> */}
  );
};

const styles = StyleSheet.create({
  touchableContainer: {
    width: "31%", // Переносим ширину сюда
    marginBottom: 12,
  },
  container: {
    flexDirection: "column",
    width: "100%",
    height: 159,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    // shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  textContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  name: {
    fontFamily: "Montserrat",
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 17.5,
    letterSpacing: 0,
    textAlign: "left",
    minHeight: 52,
  },
  imageWrapper: {
    flex: 1,
    marginTop: 0,
    overflow: "hidden",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    // backgroundColor: '#F5F5F5', // Фон для скелетона
  },
  imageContainer: {
    width: "100%",
    height: "90%",
    marginTop: 30,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(245, 245, 245, 0.85)",
  },
});
