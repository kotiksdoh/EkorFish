import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getProductList } from '@/features/catalog/catalogSlice';
import { useAppDispatch } from '@/store/hooks';
import { useRouter } from 'expo-router';

import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface CatalogCardProps {
  id: number;
  img?: any;
  name: string;
  children?: any[];
}

const { width: screenWidth } = Dimensions.get('window');
const PADDING_HORIZONTAL = 16;
const GAP = 12;
const NUM_COLUMNS = 3;

const cardWidth = (screenWidth - (PADDING_HORIZONTAL * 2) - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

export const CatalogCard: React.FC<CatalogCardProps> = ({
  id,
  img,
  name,
  children
}) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch()
  const handlePress = () => {
    console.log('Navigating to catalog-detail with:', { id, name, children });
    if (id && name) {
      // Преобразуем children в строку для передачи через URL
      const childrenString = children ? JSON.stringify(children) : '[]';
      
      dispatch(getProductList({
        params: {
          isFavorite: false,
          categoryId: id, // Раскомментируйте
          offset: 0,
          count: 10,
        }
      }));
      
      // Передаем children как параметр
      //@ts-ignore
      router.push(`dashboard/${encodeURIComponent(name)}?catalogId=${id}&catalogName=${encodeURIComponent(name)}&children=${encodeURIComponent(childrenString)}`);
    }
  };
  ///dashboard/${encodeURIComponent(name)}?catalogId=${id}&catalogName=${encodeURIComponent(name)}
  return (
    // <Link
    //   href={`/dashboard/${encodeURIComponent(name)}?catalogId=${id}&catalogName=${encodeURIComponent(name)}`}
    // >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.touchableContainer}>
      <ThemedView lightColor='#FFFFFF' darkColor='#151516' style={styles.container}>
        <View style={styles.textContainer}>
          <ThemedText 
            lightColor='#1B1B1C' 
            darkColor='#FBFCFF' 
            style={styles.name}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {name || 'Категория'}
          </ThemedText>
        </View>
        
        <View style={styles.imageWrapper}>
          {/* Индикатор загрузки */}
          {isImageLoading && (
            <View style={[styles.imageContainer, styles.loadingContainer]}>
              <ActivityIndicator 
                size="small" 
                color="#CCCCCC"
                style={styles.loader}
              />
            </View>
          )}
          
          {/* Сообщение об ошибке */}
          {imageError && (
            <View style={[styles.imageContainer, styles.errorContainer]}>
              <ThemedText style={styles.errorText}>
                Не удалось загрузить изображение
              </ThemedText>
            </View>
          )}
          
          {/* Изображение */}
          {/*  */}
          {img && !imageError && (
            <View style={styles.imageContainer}>
              <Image
                // source={{ uri: img }}
                source={img}
                style={[
                  styles.image,
                  isImageLoading && styles.imageHidden
                ]}
                resizeMode="cover"
                onLoadStart={() => {
                  setIsImageLoading(true);
                  setImageError(false);
                }}
                onLoadEnd={() => setIsImageLoading(false)}
                onError={() => {
                  setIsImageLoading(false);
                  setImageError(true);
                }}
              />
            </View>
          )}
        </View>
      </ThemedView>
      </TouchableOpacity>
    // {/* </Link> */}
  );
};

const styles = StyleSheet.create({
  touchableContainer: {
    width: '31%', // Переносим ширину сюда
    marginBottom: 12,
  },
  container: {
    flexDirection: 'column',
    width: '100%',
    height: 159,
    borderRadius: 8,
    overflow: 'hidden',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  name: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 17.5,
    letterSpacing: 0,
    textAlign: 'left',
    minHeight: 52,
  },
  imageWrapper: {
    flex: 1,
    marginTop: 40,
    overflow: 'hidden',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    // backgroundColor: '#F5F5F5', // Фон для скелетона
  },
  imageContainer: {
    width: '100%',
    height: '120%',
    marginTop: 30,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageHidden: {
    opacity: 0,
    position: 'absolute',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#F0F0F0',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#F8D7DA',
  },
  errorText: {
    fontSize: 10,
    color: '#721C24',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  loader: {
    position: 'absolute',
  },
});