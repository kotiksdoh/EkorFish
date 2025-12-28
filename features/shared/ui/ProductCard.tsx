import { CartIcon, LikeIcon, SnowflakeIcon } from '@/assets/icons/icons.js';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ProductCardProps {
  id?: number;
  img?: any;
  isFrozen?: boolean;
  name?: string;
  kgPrice?: any;
  fullPrice?: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  img,
  isFrozen,
  name,
  kgPrice,
  fullPrice,
}) => {
  // Функция для форматирования цены с пробелами
  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const [isLiked, setIsLiked] = useState(false);

  const handleLikePress = () => {
    setIsLiked(!isLiked);
    console.log(`Товар ${id} ${isLiked ? 'удален из' : 'добавлен в'} избранное`);
  };

  return (
    <ThemedView lightColor='#FFFFFF' style={styles.container}>
      {/* Верхняя часть с изображением и иконками */}
      <View style={styles.imageContainer}>
        <Image
          source={img} // Замените на ваш путь
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Иконка снежинки слева сверху */}
        {isFrozen && (
          <View style={styles.frozenIcon}>
            <SnowflakeIcon />
          </View>
        )}
        
        {/* Иконка сердечка справа сверху */}
        <TouchableOpacity 
          style={[
            styles.heartIcon,
            isLiked && styles.heartIconActive // Добавляем стиль для активного состояния
          ]} 
          onPress={handleLikePress}
          activeOpacity={0.7}
        >
          {isLiked ? (
            <LikeIcon isFilled={true} /> 
          ) : (
            <LikeIcon isFilled={false} /> 
          )}
        </TouchableOpacity>
      </View>
      
      {/* Нижняя часть с информацией */}
      <View style={styles.infoContainer}>
        {/* Название товара (обрезаем до 2 строк) */}
        <ThemedText lightColor='#1B1B1C' darkColor='#FBFCFF' style={styles.name} numberOfLines={2} ellipsizeMode="tail">
          {name || 'Название товара'}
        </ThemedText>
        
        {/* Цена и кнопка в одной строке */}
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            {/* Цена за кг */}
            <View style={styles.kgPriceRow}>
              <ThemedText lightColor='#203686' darkColor='#4C94FF' style={styles.kgPrice}>
                {kgPrice ? formatPrice(kgPrice) : '0,00'}
              </ThemedText>
              <ThemedText lightColor='#203686' darkColor='#4C94FF' style={styles.kgLabel}> ₽ / кг</ThemedText>
            </View>
            
            {/* Полная цена */}
            <ThemedText lightColor='#80818B' darkColor='#FBFCFF80' style={styles.fullPrice}>
              {fullPrice ? `${formatPrice(fullPrice)}₽` : '0,00 ₽'}
            </ThemedText>
          </View>
          
          {/* Кнопка корзины */}
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
    width: '50%', // Ширина как у изображения
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12, // Отступ между карточками
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 138,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  frozenIcon: {
    width: 16,
    height: 16,
    position: 'absolute',
    top: 2,
    left: 2,
    padding: 2,
    // backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
  },
  heartIcon: {
    width: 16,
    height: 16,
    position: 'absolute',
    top: 2,
    right: 4,
    padding: 2,
    // backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 17.5, // 14 * 1.25 = 17.5
    letterSpacing: 0,
    // color: '#000000',
    marginBottom: 8,
    minHeight: 35, // Минимальная высота для 2 строк
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
    lineHeight: 19.8, // 18 * 1.1 = 19.8
    letterSpacing: 0,
    // color: '#000000',
    // Для lining-nums и proportional-nums
    fontVariant: ['lining-nums', 'proportional-nums'],
  },
  kgLabel: {
    fontFamily: 'Montserrat',
    fontWeight: '400',
    fontSize: 18,
    // lineHeight: 13.2,
    // color: '#666666',
  },
  fullPrice: {
    fontFamily: 'Montserrat',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 14.4, // 12 * 1.2 = 14.4
    letterSpacing: -0.02, // -2%
    // color: '#666666',
    // Для lining-nums и proportional-nums
    fontVariant: ['lining-nums', 'proportional-nums'],
  },
  cartButton: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#FFED32',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  heartIconActive: {
  },
});