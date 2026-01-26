import chiken from '@/assets/icons/png/chiken.png';
import conserv from '@/assets/icons/png/conserv.png';
import fish from '@/assets/icons/png/fish.png';
import otherMeet from '@/assets/icons/png/otherMeet.png';
import { ThemedView } from '@/components/themed-view';
import SearchInput from '@/features/auth/ui/components/SearchInput';
import { CatalogCard } from '@/features/shared/ui/CatalogCard';
import { useAppSelector } from '@/store/hooks';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const CatalogScreen = () => {
  const handleButtonPress = () => {
    console.log('Button pressed!');
  };
  const catalog = useAppSelector((state) => state.auth.categories);

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
  //   {
  //       id: 9,
  //       imageUrl: otherMeet,
  //       name: 'Сезонные уловы и новинки'
  //     },
  //     {
  //       id: 10,
  //       imageUrl: otherMeet,
  //       name: 'Сезонные уловы и новинки'
  //     },
  //     {
  //       id: 11,
  //       imageUrl: otherMeet,
  //       name: 'Сезонные уловы и новинки'
  //     },
  //     {
  //       id: 12,
  //       imageUrl: otherMeet,
  //       name: 'Сезонные уловы и новинки'
  //     },
  //     {
  //       id: 13,
  //       imageUrl: otherMeet,
  //       name: 'Сезонные уловы и новинки'
  //     },
  //     {
  //       id: 14,
  //       imageUrl: otherMeet,
  //       name: 'Сезонные уловы и новинки'
  //     },
  //     {
  //       id: 15,
  //       imageUrl: otherMeet,
  //       name: 'Сезонные уловы и новинки'
  //     },
  //     {
  //       id: 16,
  //       imageUrl: otherMeet,
  //       name: 'Сезонные уловы и новинки'
  //     },
    
  // ];
  return (
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView >
        <ThemedView lightColor={'#FFFFFF'} style={styles.container}>
          <SearchInput isActiveButton={false} isHeader={true}/>
        </ThemedView>
        {/* <ThemedView lightColor={'#FFFFFF'} style={styles.container}> */}
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
        </SafeAreaView>

        {/* </ThemedView> */}


      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    // paddingBottom: 16
  },
  catalog: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 11
    // justifyContent: 'space-between',
    // Для 3 колонок на маленьких экранах
    // Для 2 колонок используйте justifyContent: 'flex-start' и marginRight
  },
 
});