import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface CatalogCardProps {
  id: number;
  img?: any;
  name: string;
}

const CatalogCardComponent: React.FC<CatalogCardProps> = ({
  id,
  img,
  name,
}) => {
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    if (!id || !name || isNavigatingRef.current) return;

    isNavigatingRef.current = true;

    router.push({
      pathname: "/dashboard/[name]",
      params: {
        name,
        catalogId: String(id),
        catalogName: name,
        isPromo: "false",
      },
    });

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 400);
  };

  const isValidImageUrl = useCallback((url: string): boolean => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (
      !trimmed ||
      trimmed === "undefined" ||
      trimmed.endsWith("/undefined")
    ) {
      return false;
    }
    return (
      trimmed.length > 10 &&
      !trimmed.endsWith("/") &&
      trimmed.startsWith("http")
    );
  }, []);

  const hasValidImageUrl =
    Boolean(img) && (typeof img !== "string" || isValidImageUrl(img));

  const showImage = hasValidImageUrl && !imageError;
  const isEmptyCard = !showImage;

  const imageSource = useMemo(() => {
    if (!showImage) {
      return null;
    }

    if (typeof img === "string") {
      return { uri: img };
    }

    return img;
  }, [img, showImage]);

  useEffect(() => {
    setImageError(false);
  }, [img]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={styles.touchableContainer}
    >
      <ThemedView
        lightColor="#FFFFFF"
        darkColor={isEmptyCard ? "#FFFFFF" : "#151516"}
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

        <View style={[styles.imageWrapper, styles.imageWrapperWhite]}>
          {showImage && imageSource ? (
            <ExpoImage
              source={imageSource}
              style={styles.image}
              contentFit="cover"
              cachePolicy="disk"
              transition={0}
              onError={() => setImageError(true)}
            />
          ) : null}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchableContainer: {
    width: "31%",
  },
  container: {
    flexDirection: "column",
    width: "100%",
    height: 159,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 1,
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
    overflow: "hidden",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  imageWrapperWhite: {
    backgroundColor: "#FFFFFF",
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
