import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
export default function DeliveryInfoCard() {
  return (
    <ThemedView lightColor='#E1F0FF' darkColor='#212945' style={styles.container}>
      <View style={styles.textContainer}>
        <ThemedText lightColor='#1B1B1C' darkColor='#FBFCFF' style={styles.text}>
          При заказе до 11:00{'\n'}доставим в тот же день {'\n'}в Москве и Санкт-Петербурге
        </ThemedText>
      </View>
      <Image
        source={require('../../../../assets/icons/png/carPng.png')} // Замените на путь к вашей картинке
        style={styles.image}
        resizeMode="contain"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    // backgroundColor: ,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8, 
    // margin: 16,
    marginBottom: 16,
    marginRight: 16,
    marginLeft: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative'
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
    // color: '#000000', 
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