import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

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
  return (
    <View style={[
      styles.header,
      transparent && styles.headerTransparent
    ]}>
      <View style={styles.headerContent}>
        <View></View>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={onLoginPress}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.loginButtonText}>Войти</ThemedText>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#FFFFFF',
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
    color: '#1B1B1C',
  },
});