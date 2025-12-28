import chiken from '@/assets/icons/png/chiken.png';
import conserv from '@/assets/icons/png/conserv.png';
import fish from '@/assets/icons/png/fish.png';
import otherMeet from '@/assets/icons/png/otherMeet.png';
import { ThemedText } from '@/components/themed-text';
import { CatalogCard } from '@/features/shared/ui/CatalogCard';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';


export default function Catalog() {
  // Пример данных каталога
  const catalog = [
    {
      id: 1,
      img: fish, 
      name: 'Рыба свежая и замороженная'
    },
    {
      id: 2,
      img: chiken,
      name: 'Морепродукты и ракообразные'
    },
    {
      id: 3,
      img: conserv,
      name: 'Икра и деликатесы'
    },
    {
      id: 4,
      img: otherMeet,
      name: 'Готовая продукция и полуфабрикаты'
    },
    {
      id: 5,
      img: fish,
      name: 'Консервы и закуски'
    },
    {
      id: 6,
      img: chiken,
      name: 'Спецпредложения и акции'
    },
    {
      id: 7,
      img: conserv,
      name: 'Премиум сегмент эксклюзив'
    },
    {
      id: 8,
      img: otherMeet,
      name: 'Сезонные уловы и новинки'
    },
  ];

  return (
    <View style={styles.container}>
      <ThemedText 
        style={styles.catalogMainText} 
        lightColor='#1B1B1C' 
        darkColor='#FBFCFF'
      >
        Каталог товаров
      </ThemedText>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.catalog}>
          {catalog.map((item) => (
            <CatalogCard
              key={item.id}
              id={item.id}
              img={item.img}
              name={item.name}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  catalogMainText: {
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: 'Montserrat',
    
  },
  scrollContent: {
    paddingBottom: 20,
  },
  catalog: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    // justifyContent: 'space-between',
    // Для 3 колонок на маленьких экранах
    // Для 2 колонок используйте justifyContent: 'flex-start' и marginRight
  },
});