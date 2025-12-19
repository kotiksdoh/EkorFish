// components/ui/svg-icon.tsx
import React from 'react';
import { View } from 'react-native';

// Импортируем SVG как React компоненты
import AiIcon from '@/assets/icons/AI.svg';
import DashBoardIcon from '@/assets/icons/dashboard.svg';
import HeartIcon from '@/assets/icons/Heart.svg';
import HomeIcon from '@/assets/icons/Home.svg';
import ShopIcon from '@/assets/icons/Shop.svg';
import UserIcon from '@/assets/icons/User.svg';

import AiIcon_fill from '@/assets/icons/AI_fill.svg';
import DashBoardIcon_fill from '@/assets/icons/Dashboard_fill.svg';
import HeartIcon_fill from '@/assets/icons/Heart_fill.svg';
import HomeIcon_fill from '@/assets/icons/Home_fill.svg';
import ShopIcon_fill from '@/assets/icons/Shop_fill.svg';
import UserIcon_fill from '@/assets/icons/User.svg';



// import HomeActiveIcon from '@/assets/icons/home-active.svg';
// import ExploreIcon from '@/assets/icons/explore.svg';
// import ExploreActiveIcon from '@/assets/icons/explore-active.svg';

// Если хотите использовать один SVG с изменением цвета
// import HomeIcon from '@/assets/icons/home.svg';
// import ExploreIcon from '@/assets/icons/explore.svg';

export type SvgIconName = 
  | 'home' 
  | 'dashboard'
  | 'ai'
  | 'heart'
  | 'shop'
  | 'user'
  | 'home-active' 
  | 'dashboard-active'
  | 'ai-active'
  | 'heart-active'
  | 'shop-active'
  | 'user-active';

interface SvgIconProps {
  name: SvgIconName;
  size?: number;
  color?: string;
  focused?: boolean;
}

/**
 * Компонент для кастомных SVG иконок
 * Автоматически переключается между активным и неактивным состоянием
 */
export function SvgIcon({ name, size = 28, color, focused = false }: SvgIconProps) {
  const iconColor = focused ? color : 'white';
  const renderIcon = () => {
    switch (name) {
        case 'home':
        case 'home-active':
        if (focused || name === 'home-active') {
            return <HomeIcon_fill width={size} height={size} />;
        }
        return <HomeIcon width={size} height={size}  />;
        
        case 'dashboard':
        case 'dashboard-active':
        if (focused || name === 'dashboard-active') {
            return <DashBoardIcon_fill width={size} height={size}  />;
        }
        return <DashBoardIcon width={size} height={size}  />;
        case 'ai':
        case 'ai-active':
            if (focused || name === 'ai-active') {
            return <AiIcon_fill width={size} height={size}  />;
            }
            return <AiIcon width={size} height={size}  />;
        case 'heart':
        case 'heart-active':
            if (focused || name === 'heart-active') {
            return <HeartIcon_fill width={size} height={size} />;
            }
            return <HeartIcon width={size} height={size}  />;
        case 'shop':
        case 'shop-active':
            if (focused || name === 'shop-active') {
            return <ShopIcon_fill width={size} height={size}  />;
            }
            return <ShopIcon width={size} height={size} />;
        case 'user':
        case 'user-active':
            if (focused || name === 'user-active') {
            return <UserIcon width={size} height={size} fill={iconColor} />;
            }
            return <UserIcon width={size} height={size} fill={iconColor} />;                    
        default:
            return null;
        }
    };

  return <View>{renderIcon()}</View>;
}