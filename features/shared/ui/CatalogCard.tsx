import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';

interface CatalogCardProps {
  id?: number;
  img?: any;
  name?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const PADDING_HORIZONTAL = 16;
const GAP = 12;
const NUM_COLUMNS = 3;

// Вычисляем ширину карточки динамически
const cardWidth = (screenWidth - (PADDING_HORIZONTAL * 2) - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

export const CatalogCard: React.FC<CatalogCardProps> = ({
  id,
  img,
  name,
}) => {
 
  return (
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
        <View style={styles.imageContainer}>
          <Image
            source={img} 
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '31%',
    height: 159, // Соотношение сторон 1:1.35
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
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
});