import { ThemedText } from '@/components/themed-text';
import { CatalogCard } from '@/features/shared/ui/CatalogCard';
import { useAppSelector } from '@/store/hooks';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';


export default function Catalog() {
  const catalog = useAppSelector((state) => state.auth.categories);
  const visibleCatalog = useMemo(() => catalog, [catalog]);

  return (
    <View style={styles.container}>
      <ThemedText 
        style={styles.catalogMainText} 
        lightColor='#1B1B1C' 
        darkColor='#FBFCFF'
      >
        Каталог товаров
      </ThemedText>
      
      <View style={styles.catalog}>
        {visibleCatalog.map((item: any) => (
          <CatalogCard
            key={item.id}
            id={item.id}
            img={item.imageUrl}
            name={item.name}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 16,
    paddingRight: 8,
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