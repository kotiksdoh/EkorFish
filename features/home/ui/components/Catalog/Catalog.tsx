import { ThemedText } from '@/components/themed-text';
import { CatalogCard } from '@/features/shared/ui/CatalogCard';
import { useAppSelector } from '@/store/hooks';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';


export default function Catalog() {
  const catalog = useAppSelector((state) => state.auth.categories);

  const renderCatalogCard = ({ item }: { item: any }) => (
    <CatalogCard
      key={item.id}
      id={item.id}
      img={item.imageUrl}
      name={item.name}
      children={item.children}
    />
  );

  const numColumns = 3;
  const keyExtractor = (item: any) => String(item.id);

  return (
    <View style={styles.container}>
      <ThemedText 
        style={styles.catalogMainText} 
        lightColor='#1B1B1C' 
        darkColor='#FBFCFF'
      >
        Каталог товаров
      </ThemedText>
      
      <FlatList
        data={catalog}
        renderItem={renderCatalogCard}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  columnWrapper: {
    gap: 8,
    marginBottom: 8,
  },
  catalog: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});