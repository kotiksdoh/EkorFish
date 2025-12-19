import { PrimaryButton } from '@/features/shared/ui/components/PrimartyButton';
import React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { AutoSlider, SlideItem } from '../components/AutoSlider';

// Временные данные для слайдера (замените на реальные URL)
const SLIDER_ITEMS: SlideItem[] = [
  {
    id: '1',
    imageUrl: 'https://cs10.pikabu.ru/post_img/big/2018/02/20/10/1519147784145166438.jpg',
    title: 'Рыбалка мечты',
    subtitle: 'Лучшие места для рыбалки',
  },
  {
    id: '2',
    imageUrl: 'https://prophotos.ru/data/articles/0002/4092/image-rectangle_600_x.jpg',
    title: 'Новые снасти',
    subtitle: 'Скидки до 30%',
  },
  {
    id: '3',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5y_CQNi9oiqn96_0204tGgLQuUxigGKLe1w&s',
    title: 'Мастер-классы',
    subtitle: 'Онлайн обучение',
  },
];

export const HomeScreen = () => {
  const handleButtonPress = () => {
    console.log('Button pressed!');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Слайдер */}
        <View className="mb-6">
          <AutoSlider
            items={SLIDER_ITEMS}
            autoPlayInterval={4000}
            showIndicators={true}
          />
        </View>

        {/* Контент */}
        <View className="px-4">
          <Text className="text-2xl font-bold text-primary mb-4">
            Добро пожаловать в EkorFish!
          </Text>
          
          <Text className="text-base text-gray-600 mb-6">
            Платформа для настоящих рыбаков. Находите лучшие места, 
            покупайте снасти и общайтесь с единомышленниками.
          </Text>

          {/* Примеры использования кнопки */}
          <View className="space-y-4 mb-8">
            <PrimaryButton
              title="Начать рыбалку"
              onPress={handleButtonPress}
              variant="primary"
              size="lg"
              fullWidth
            />

            <PrimaryButton
              title="Каталог снастей"
              onPress={handleButtonPress}
              variant="secondary"
              size="md"
              fullWidth
            />

            <PrimaryButton
              title="Подробнее"
              onPress={handleButtonPress}
              variant="outline"
              size="md"
              fullWidth
            />

            <PrimaryButton
              title="Загрузка..."
              onPress={handleButtonPress}
              variant="primary"
              size="md"
              loading={true}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};