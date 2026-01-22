import { ThemedText } from '@/components/themed-text';
import { CatalogCard } from '@/features/shared/ui/CatalogCard';
import { useAppSelector } from '@/store/hooks';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';


export default function Catalog() {
  // Пример данных каталога
  const catalog = useAppSelector((state) => state.auth.categories);
  // console.log('catalog', catalog)
  // const catalog = [
  //   {
  //     id: 1,
  //     imageUrl: fish, 
  //     name: 'Рыба свежая и замороженная'
  //   },
  //   {
  //     id: 2,
  //     imageUrl: chiken,
  //     name: 'Морепродукты и ракообразные'
  //   },
  //   {
  //     id: 3,
  //     imageUrl: conserv,
  //     name: 'Икра и деликатесы'
  //   },
  //   {
  //     id: 4,
  //     imageUrl: otherMeet,
  //     name: 'Готовая продукция и полуфабрикаты'
  //   },
  //   {
  //     id: 5,
  //     imageUrl: fish,
  //     name: 'Консервы и закуски'
  //   },
  //   {
  //     id: 6,
  //     imageUrl: chiken,
  //     name: 'Спецпредложения и акции'
  //   },
  //   {
  //     id: 7,
  //     imageUrl: conserv,
  //     name: 'Премиум сегмент эксклюзив'
  //   },
  //   {
  //     id: 8,
  //     imageUrl: otherMeet,
  //     name: 'Сезонные уловы и новинки'
  //   },
  // ];

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
              img={item.imageUrl}
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