import { Tabs } from 'expo-router';
import React from 'react';
import '../../global.css';

import { HapticTab } from '@/components/haptic-tab';
import { SvgIcon } from '@/components/ui/custom-icon';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
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
          <SvgIcon 
            name="shop" 
            size={24} 
            color={color} 
            focused={focused}
          />,
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
  );
}
