import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
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
  return (
    <ThemedView lightColor='#FFFFFF' style={styles.container}>
        <View>
            <Image
                source={require('../../../assets/icons/png/carPng.png')} // Замените на путь к вашей картинке
                style={styles.image}
                resizeMode="contain"
            />
        </View>
    </ThemedView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8, 
    // margin: 16,
    marginTop: 20,
    overflow: 'hidden',
    position: 'relative'
  },
  image: {
    width: 189,
    height: 138,
  },
});