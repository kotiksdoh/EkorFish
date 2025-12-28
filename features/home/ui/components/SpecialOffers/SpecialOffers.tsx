import barabulkaImage from '@/assets/icons/png/barabulka.png';
import semgaImage from '@/assets/icons/png/semga.png';
import { ThemedView } from '@/components/themed-view';
import { ProductCard } from '@/features/shared/ui/ProductCard';
import { PrimaryButton } from '@/features/shared/ui/components/PrimartyButton';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function SpecialOffers() {

    const products = [
        {
            id: 1,
            img: barabulkaImage,
            isFrozen: true,
            name: 'Барабулька н/р 12шт х 0,6кг 1/12 Араката dsds sds',
            kgPrice: 1130.30,
            fullPrice: 15130.40
        },
        {
            id: 2,
            img: semgaImage,
            isFrozen: true,
            name: 'Барабулька н/р 12шт х 0,6кг 1/12 Араката',
            kgPrice: 1130.30,
            fullPrice: 15130.40
        }
    ]

  return (
    <ThemedView lightColor='#FFFFFF' style={styles.container}>
        <View style={styles.productsContainer}>
        {products.map((item) => 
        <ProductCard
            id={item?.id}
            img={item?.img}
            isFrozen={item?.isFrozen}
            name={item?.name}
            kgPrice={item?.kgPrice}
            fullPrice={item?.fullPrice}
        />
        )
        }
        </View>
        <PrimaryButton
            title="Все предложения"
            onPress={() => {console.log('')}}
            variant="third"
            size="md"
            loading={false}
            activeOpacity={0.8}
            fullWidth
            />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
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
  productsContainer: {
    flexDirection: 'row',
    marginBottom: 24,

  },
  buttonContainer: {
    marginTop: 24,
    paddingHorizontal: 16
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start'
    // marginRight: 12,
  },
  text: {
    fontFamily: 'Montserrat-Medium', 
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18.2, 
    letterSpacing: 0,
    color: '#000000', 
    width: '70%'

  },
  image: {
    position: 'absolute',
    width: 171,
    height: 71,
    transform: [{ scaleX: -1 }] ,
    right: -50
  },
});