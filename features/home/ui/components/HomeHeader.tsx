import { LemonIcon, PersonCircleIcon } from '@/assets/icons/icons.js';
import { ThemedText } from '@/components/themed-text';
import { useAppSelector } from '@/store/hooks';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
interface HomeHeaderProps {
  title?: string;
  transparent?: boolean;
  onLoginPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  title = 'EkorFish',
  transparent = true,
  onLoginPress,
}) => {
  const me = useAppSelector((state) => state.auth.me);
  console.log('mee',me)
  const systemTheme = useColorScheme(); 
  const currentTheme = systemTheme || 'light' 
  const codeBackgroundColor = currentTheme === 'dark' ? '#202022' : '#F2F4F7';
  return (
    <View style={[
      styles.header,
      transparent && styles.headerTransparent
    ]}>
      { me === null ?
      <View style={styles.headerContent}>
        <View></View>
        <TouchableOpacity
          style={[{  backgroundColor: codeBackgroundColor }, styles.loginButton]}
          onPress={onLoginPress}
          activeOpacity={0.7}
        >
          <ThemedText darkColor='#FBFCFF' lightColor='#1B1B1C' style={styles.loginButtonText}>Войти</ThemedText>
        </TouchableOpacity>
      </View>
      :
      <View style={styles.headerContent}>
      <TouchableOpacity
        style={styles.headInfo}
        // onPress={onLoginPress}
        activeOpacity={0.7}
      >
        <PersonCircleIcon/>
        <ThemedText 
          lightColor='#FBFCFF' 
          darkColor='#FBFCFF'
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ maxWidth: 150 }} // Примерная ширина для 24 символов
        >
          {me?.companies.length === 0 ? 
          `${me?.individualProfile?.firstName} ${me?.individualProfile?.lastName} ${me?.individualProfile?.patronymic}`
           : me?.companies[0]?.name}
        </ThemedText>
      </TouchableOpacity>
      <View style={styles.headInfoBonus}>
        <LemonIcon/>
        <ThemedText lightColor='#FBFCFF' darkColor='#FBFCFF'>222</ThemedText>
      </View>
      </View>
      } 
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 100,
    // paddingTop: 60, // Отступ для статус бара
    paddingHorizontal: 16,
  },
  headerTransparent: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // height: 56,
    paddingVertical: 6
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#203686',
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    // backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(32, 54, 134, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '500',
    // color: '#1B1B1C',
  },
  headInfo:{
    gap:8,
    display:'flex',
    flexDirection:'row',
  },
  headInfoBonus:{
    gap:4,
    display:'flex',
    flexDirection:'row',
  }
});