import { ThemedView } from '@/components/themed-view';
import SearchInput from '@/features/auth/ui/components/SearchInput';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { AutoSlider, SlideItem } from '../components/AutoSlider';
import Catalog from '../components/Catalog/Catalog';
import DeliveryInfoCard from '../components/DeliveryInfoCard';
import { HomeHeader } from '../components/HomeHeader';
import SpecialOffers from '../components/SpecialOffers/SpecialOffers';

// Временные данные для слайдера (замените на реальные URL)
const SLIDER_ITEMS: SlideItem[] = [
  {
    id: '1',
    imageUrl: 'https://cs10.pikabu.ru/post_img/big/2018/02/20/10/1519147784145166438.jpg',

  },
  {
    id: '2',
    imageUrl: 'https://prophotos.ru/data/articles/0002/4092/image-rectangle_600_x.jpg',

  },
  {
    id: '3',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5y_CQNi9oiqn96_0204tGgLQuUxigGKLe1w&s',

  },
  {
    id: '4',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5y_CQNi9oiqn96_0204tGgLQuUxigGKLe1w&s',

  },
  {
    id: '5',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5y_CQNi9oiqn96_0204tGgLQuUxigGKLe1w&s',

  },
];

export const HomeScreen = ({ handleLoginPress }: { handleLoginPress: () => void }) => {
  const handleButtonPress = () => {
    console.log('Button pressed!');
  };

  return (
    // <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
              <HomeHeader 
                title="EkorFish" 
                transparent={true} 
                onLoginPress={handleLoginPress}
              />
        {/* Слайдер */}
        <ThemedView lightColor={'#FFFFFF'} style={styles.container}>
          <AutoSlider
            items={SLIDER_ITEMS}
            autoPlayInterval={4000}
            showIndicators={true}
          />
          <SearchInput/>
          <DeliveryInfoCard/>
          
        </ThemedView>
        <SpecialOffers/>
        <Catalog/>
      </ScrollView>
    // </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    // paddingBottom: 16
  },
 
});