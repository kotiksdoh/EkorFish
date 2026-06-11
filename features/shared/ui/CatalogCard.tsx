import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";

import React, { useCallback, useMemo } from "react";
import {
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

const PLACEHOLDER_IMAGE = require("@/assets/icons/png/noImage.png");

const CatalogCardComponent: React.FC<CatalogCardProps> = ({
  id,
  img,
  name,
  children,
}) => {
  const router = useRouter();
  const handlePress = () => {
    if (id && name) {
      const childrenString = children ? JSON.stringify(children) : "[]";

      //@ts-ignore
      router.push(
        `dashboard/${encodeURIComponent(name)}?catalogId=${id}&catalogName=${encodeURIComponent(name)}&children=${encodeURIComponent(childrenString)}&isPromo=false`,
      );
    }
  };

  const isValidImageUrl = useCallback((url: string): boolean => {
    if (!url || typeof url !== "string") return false;
    return url.length > 10 && !url.endsWith("/") && url.startsWith("http");
  }, []);

  const imageSource = useMemo(
    () =>
      !img || (typeof img === "string" && !isValidImageUrl(img))
        ? PLACEHOLDER_IMAGE
        : typeof img === "string"
          ? { uri: img }
          : img,
    [img, isValidImageUrl],
  );
  
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
            darkColor="#1B1B1C"
            style={styles.name}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {name || "Категория"}
          </ThemedText>
        </View>

        <View style={styles.imageWrapper}>
          <View style={styles.imageContainer}>
            <ExpoImage
              source={imageSource}
              style={styles.image}
              contentFit="cover"
              cachePolicy="disk"
              transition={120}
            />
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
  },
  container: {
    flexDirection: "column",
    width: "100%",
    height: 159,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 1,
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
    height: "100%",
    // marginTop: 30,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export const CatalogCard = React.memo(CatalogCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.img === nextProps.img &&
    prevProps.name === nextProps.name
  );
});
