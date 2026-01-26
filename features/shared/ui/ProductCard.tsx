import { CartIcon, LikeIcon, SnowflakeIcon } from '@/assets/icons/icons.js';
import noImage from '@/assets/icons/png/noImage.png';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ProductCardProps {
  id?: number;
  img?: any; // ImageSourcePropType или число (require) или объект {uri: string}
  isFrozen?: boolean;
  name?: string;
  kgPrice?: any;
  fullPrice?: any;
  isImageLoading?: boolean; // Можно передавать извне
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  img,
  isFrozen,
  name,
  kgPrice,
  fullPrice,
  isImageLoading: externalLoading = false,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Если передали внешний статус загрузки
  useEffect(() => {
    if (!externalLoading && img) {
      setIsImageLoading(true);
      setIsImageLoaded(false);
      setImageError(false);
    }
  }, [img, externalLoading]);

  const handleLikePress = () => {
    setIsLiked(!isLiked);
    console.log(`Товар ${id} ${isLiked ? 'удален из' : 'добавлен в'} избранное`);
  };

  const handleImageLoadStart = () => {
    setIsImageLoading(true);
    setImageError(false);
  };

  const handleImageLoadEnd = () => {
    setIsImageLoading(false);
    setIsImageLoaded(true);
  };

  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
  };

  // Функция для форматирования цены
  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <ThemedView lightColor='#FFFFFF' style={styles.container}>
      {/* Верхняя часть с изображением */}
      <View style={styles.imageContainer}>
        {!isImageLoaded && (isImageLoading || externalLoading) && (
          <View style={[styles.image, styles.imageLoadingContainer]}>
            <ActivityIndicator 
              size="small" 
              color="#666666"
              style={styles.loader}
            />
          </View>
        )}
        
        {imageError && (
          <View style={[styles.image, styles.imageErrorContainer]}>
            <ThemedText style={styles.errorText}>Не удалось загрузить</ThemedText>
          </View>
        )}
        
        {/* Основное изображение */}
        {img && !imageError && (
          <Image
            source={img}
            style={[
              styles.image,
              (!isImageLoaded || isImageLoading || externalLoading) && styles.imageHidden
            ]}
            resizeMode="cover"
            onLoadStart={handleImageLoadStart}
            onLoadEnd={handleImageLoadEnd}
            onError={handleImageError}
          />
        )}
        {!img && (
                    <Image
                    source={noImage}
                    style={[
                      styles.image,
                      // (!isImageLoaded || isImageLoading || externalLoading) && styles.imageHidden
                    ]}
                    resizeMode="cover"
                    onLoadStart={handleImageLoadStart}
                    onLoadEnd={handleImageLoadEnd}
                    onError={handleImageError}
                  />
        )
        }
        
        {/* Иконки поверх изображения */}
        {isFrozen && !isImageLoading && (
          <View style={styles.frozenIcon}>
            <SnowflakeIcon />
          </View>
        )}
        
        <TouchableOpacity 
          style={[
            styles.heartIcon,
            isLiked && styles.heartIconActive
          ]} 
          onPress={handleLikePress}
          activeOpacity={0.7}
        >
          {!isImageLoading && (
            isLiked ? (
              <LikeIcon isFilled={true} /> 
            ) : (
              <LikeIcon isFilled={false} /> 
            )
          )}
        </TouchableOpacity>
      </View>
      
      {/* Нижняя часть с информацией */}
      <View style={styles.infoContainer}>
        <ThemedText 
          lightColor='#1B1B1C' 
          darkColor='#FBFCFF' 
          style={styles.name} 
          numberOfLines={2} 
          ellipsizeMode="tail"
        >
          {name || 'Название товара'}
        </ThemedText>
        
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <View style={styles.kgPriceRow}>
              <ThemedText lightColor='#203686' darkColor='#4C94FF' style={styles.kgPrice}>
                {kgPrice ? kgPrice : '0,00'}
              </ThemedText>
              <ThemedText lightColor='#203686' darkColor='#4C94FF' style={styles.kgLabel}>₽ / кг</ThemedText>
            </View>
            
            <ThemedText lightColor='#80818B' darkColor='#FBFCFF80' style={styles.fullPrice}>
              {fullPrice ? `${fullPrice}₽` : '0,00 ₽'}
            </ThemedText>
          </View>
          
          <TouchableOpacity style={styles.cartButton}>
            <CartIcon />
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '48.8%',
    borderRadius: 8,
    overflow: 'hidden',
    // marginRight: 12,
    // marginLeft: 12,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 138,
    // backgroundColor: '#F5F5F5', // Фон пока грузится
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageHidden: {
    opacity: 0,
    position: 'absolute',
  },
  imageLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  imageErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#F8D7DA',
  },
  errorText: {
    fontSize: 10,
    color: '#721C24',
    textAlign: 'center',
    padding: 4,
  },
  loader: {
    position: 'absolute',
  },
  frozenIcon: {
    width: 16,
    height: 16,
    position: 'absolute',
    top: 2,
    left: 2,
    padding: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  heartIcon: {
    width: 16,
    height: 16,
    position: 'absolute',
    top: 2,
    right: 4,
    padding: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 17.5,
    letterSpacing: 0,
    marginBottom: 8,
    minHeight: 35,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
  },
  kgPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  kgPrice: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 19.8,
    letterSpacing: 0,
    fontVariant: ['lining-nums', 'proportional-nums'],
  },
  kgLabel: {
    fontFamily: 'Montserrat',
    fontWeight: '400',
    fontSize: 18,
  },
  fullPrice: {
    fontFamily: 'Montserrat',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 14.4,
    letterSpacing: -0.02,
    fontVariant: ['lining-nums', 'proportional-nums'],
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFED32',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  heartIconActive: {},
});