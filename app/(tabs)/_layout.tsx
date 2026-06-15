// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import '../../global.css';

import { TemplatePickerProvider } from '@/features/templates/TemplatePickerContext';
import { HapticTab } from '@/components/haptic-tab';
import { SvgIcon } from '@/components/ui/custom-icon';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useAppSelector } from '@/store/hooks';
import { View } from 'react-native';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  const { currentTheme } = useAppTheme();
  const cart = useAppSelector((state) => state.catalog.cart);

  return (
    <TemplatePickerProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[currentTheme].tint, // Используем currentTheme
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) =>             
              <SvgIcon 
                name="home" 
                size={24} 
                color={color} 
                focused={focused}
              />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarIcon: ({ color, focused }) =>             
              <SvgIcon 
                name="dashboard" 
                size={24} 
                color={color} 
                focused={focused}
              />,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            tabBarIcon: ({ color, focused }) =>             
              <SvgIcon 
                name="ai" 
                size={24} 
                color={color} 
                focused={focused}
              />,
          }}
        />
        <Tabs.Screen
          name="heart"
          options={{
            tabBarIcon: ({ color, focused }) =>             
              <SvgIcon 
                name="heart" 
                size={24} 
                color={color} 
                focused={focused}
              />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            tabBarIcon: ({ color, focused }) =>     
              <> 
                {cart?.length > 0 && (
                  <View style={styles.filterBadge}></View>
                )}
                <SvgIcon 
                  name="shop" 
                  size={24} 
                  color={color} 
                  focused={focused}
                />
              </>,
          }}
        />
        <Tabs.Screen
          name="user"
          options={{
            tabBarIcon: ({ color, focused }) =>       
              <SvgIcon 
                name="user" 
                size={24} 
                color={color} 
                focused={focused}
              />,
          }}
        />
      </Tabs>
    </TemplatePickerProvider>
  );
}

const styles = StyleSheet.create({
  filterBadge: {
    position: 'absolute',
    top: 1,
    right: -1,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 6,
    maxWidth: 6,
    width: 6,
    height: 6,
    zIndex: 1,
    alignItems: 'center',
  },
});