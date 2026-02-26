import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SlideItem } from './AutoSlider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AutoSliderItemProps {
  item: SlideItem;
  sliderHeight: number;
  isProduct?: boolean
}

export const AutoSliderItem: React.FC<AutoSliderItemProps> = ({ 
  item, 
  sliderHeight,
  isProduct
}) => {
  const imageWidth = SCREEN_WIDTH - 32; // 16px margin с каждой стороны
  
  return (
    <View style={[styles.container, { width: SCREEN_WIDTH }]}>
      <View style={[styles.imageWrapper, { height: sliderHeight }]}>
        <Image
          source={{ uri: item.imageUrl }}
          style={[
            isProduct ? styles.productImage :  styles.image// Добавлен условный стиль
          ]}
          resizeMode="cover"
          onError={(e) => console.log('Image error:', e.nativeEvent.error)}
          onLoad={() => console.log('')}
        />
        
        {/* Градиент overlay */}
        <View style={styles.gradientOverlay} />
        
        {/* Текстовый контент */}
        <View style={styles.textContainer}>
          {item.title && (
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          )}
          {item.subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: '100%',
    // paddingHorizontal: 16,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    // borderRadius: 16,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
  productImage: {
    width: '93%',
    height: '95%',
    borderRadius: 24,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 100,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
    // backgroundColor: 'rgba(0,0,0,0.4)',
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    padding: 16,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});