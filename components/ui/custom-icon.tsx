import React from 'react';
import { View } from 'react-native';

// ИМПОРТЫ КАК ТЫ ХОЧЕШЬ
// import HomeIcon from '@/assets/icons/Home.svg';
// import HomeIcon_fill from '@/assets/icons/Home_fill.svg';
// import DashBoardIcon from '@/assets/icons/dashboard.svg';
// import DashBoardIcon_fill from '@/assets/icons/Dashboard_fill.svg';
// import AiIcon from '@/assets/icons/AI.svg';
// import AiIcon_fill from '@/assets/icons/AI_fill.svg';
// import HeartIcon from '@/assets/icons/Heart.svg';
// import HeartIcon_fill from '@/assets/icons/Heart_fill.svg';
// import ShopIcon from '@/assets/icons/Shop.svg';
// import ShopIcon_fill from '@/assets/icons/Shop_fill.svg';
// import UserIcon from '@/assets/icons/User.svg';
import {
  AiIcon,
  AiIconFill,
  DashBoardIcon,
  DashBoardIconFill,
  HeartIcon,
  HeartIconFill,
  HomeIcon,
  HomeIconFill,
  ShopIcon,
  ShopIconFill,
  UserIcon
} from '@/assets/icons/icons.js';
// UserIcon_fill пока не используем

export type SvgIconName = 
  | 'home' | 'dashboard' | 'ai' | 'heart' | 'shop' | 'user'
  | 'home-active' | 'dashboard-active' | 'ai-active' 
  | 'heart-active' | 'shop-active' | 'user-active';

interface SvgIconProps {
  name: SvgIconName;
  size?: number;
  color?: string;
  focused?: boolean;
}

export function SvgIcon({ name, size = 28, color, focused = false }: SvgIconProps) {
  const iconColor = focused ? color : 'white';
  
  const renderIcon = () => {
    switch (name) {
      case 'home':
      case 'home-active':
        if (focused || name === 'home-active') {
          return <HomeIconFill width={size} height={size} fill={color} />;
        }
        return <HomeIcon width={size} height={size} fill={color} />;
      
      case 'dashboard':
      case 'dashboard-active':
        if (focused || name === 'dashboard-active') {
          return <DashBoardIconFill width={size} height={size} fill={color} />;
        }
        return <DashBoardIcon width={size} height={size} fill={color} />;
      
      case 'ai':
      case 'ai-active':
        if (focused || name === 'ai-active') {
          return <AiIconFill width={size} height={size} fill={color} />;
        }
        return <AiIcon width={size} height={size} fill={color} />;
      
      case 'heart':
      case 'heart-active':
        if (focused || name === 'heart-active') {
          return <HeartIconFill width={size} height={size} fill={color} />;
        }
        return <HeartIcon width={size} height={size} fill={color} />;
      
      case 'shop':
      case 'shop-active':
        if (focused || name === 'shop-active') {
          return <ShopIconFill width={size} height={size} fill={color} />;
        }
        return <ShopIcon width={size} height={size} fill={color} />;
      
      case 'user':
      case 'user-active':
        // Пока используем одну иконку для обоих состояний
        return <UserIcon width={size} height={size} fill={color} />;
      
      default:
        return null;
    }
  };

  return <View>{renderIcon()}</View>;
}