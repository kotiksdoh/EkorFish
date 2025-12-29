import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  useColorScheme
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'third';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  theme?: 'light' | 'dark' | 'auto';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  theme = 'auto',
  ...props
}) => {
  const systemTheme = useColorScheme(); // Получаем системную тему
  const currentTheme = theme === 'auto' ? systemTheme : theme;
  const isDarkMode = currentTheme === 'dark';
  
  // Определяем цвет для primary варианта в зависимости от темы
  const primaryColor = isDarkMode ? '#3881EE' : '#203686';
  const textColor = variant === 'primary' ? '#FFFFFF' : primaryColor;
  const activityIndicatorColor = variant === 'primary' ? '#FFFFFF' : primaryColor;
  
  // Обновляем variantStyles с динамическим цветом для primary
  const variantStyles: Record<ButtonVariant, any> = {
    primary: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    secondary: {
      backgroundColor: '#E6E6E6',
      borderColor: '#E6E6E6',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: primaryColor,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    third: {
      backgroundColor: '#F5F5F5',
      borderColor: 'transparent',
    },
  };

  const sizeStyles: Record<ButtonSize, any> = {
    sm: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    md: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    lg: {
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 16,
    },
  };

  const textSizeStyles: Record<ButtonSize, any> = {
    sm: {
      fontSize: 14,
    },
    md: {
      fontSize: 16,
    },
    lg: {
      fontSize: 18,
    },
  };

  const baseStyles = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(fullWidth ? { width: '100%' } : {}),
    ...(disabled || loading ? { opacity: 0.5 } : {}),
    ...(style as object),
  };

  const textStyles = {
    fontWeight: '600',
    textAlign: 'center' as const,
    color: textColor,
    ...textSizeStyles[size],
  };

  return (
    <TouchableOpacity
      style={baseStyles}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={activityIndicatorColor}
          size="small"
          style={{ marginRight: 8 }}
        />
      ) : leftIcon ? (
        <View style={{ marginRight: 8 }}>{leftIcon}</View>
      ) : null}
      
      <Text style={textStyles}>{title}</Text>
      
      {!loading && rightIcon && (
        <View style={{ marginLeft: 8 }}>{rightIcon}</View>
      )}
    </TouchableOpacity>
  );
};

// Если вы используете NativeWind и хотите сохранить стилизацию через className:
export const PrimaryButtonWithTailwind: React.FC<PrimaryButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  theme = 'auto',
  ...props
}) => {
  const systemTheme = useColorScheme();
  const currentTheme = theme === 'auto' ? systemTheme : theme;
  const isDarkMode = currentTheme === 'dark';
  
  // Динамический класс для primary цвета
  const primaryColorClass = isDarkMode ? 'bg-[#3881EE] border-[#3881EE]' : 'bg-[#203686] border-[#203686]';
  
  const variantClasses: Record<ButtonVariant, string> = {
    primary: primaryColorClass,
    secondary: 'bg-secondary border-secondary',
    outline: `bg-transparent border ${isDarkMode ? 'border-[#3881EE]' : 'border-[#203686]'}`,
    ghost: 'bg-transparent border-transparent',
    third: 'bg-third border-transparent',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 rounded-lg',
    md: 'px-6 py-3 rounded-xl',
    lg: 'px-8 py-4 rounded-2xl',
  };

  const textSizeClasses: Record<ButtonSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const textColorClasses: Record<ButtonVariant, string> = {
    primary: 'text-white',
    secondary: isDarkMode ? 'text-[#3881EE]' : 'text-[#203686]',
    outline: isDarkMode ? 'text-[#3881EE]' : 'text-[#203686]',
    ghost: isDarkMode ? 'text-[#3881EE]' : 'text-[#203686]',
    third: 'text-blackAndBlack'
  };

  const baseClasses = cn(
    'flex-row items-center justify-center border',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-50' : 'active:opacity-80',
    style as string
  );

  const textClasses = cn(
    'font-semibold text-center',
    textSizeClasses[size],
    textColorClasses[variant]
  );

  const activityIndicatorColor = variant === 'primary' ? '#FFFFFF' : (isDarkMode ? '#3881EE' : '#203686');

  return (
    <TouchableOpacity
      className={baseClasses}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={activityIndicatorColor}
          size="small"
          className="mr-2"
        />
      ) : leftIcon ? (
        <View className="mr-2">{leftIcon}</View>
      ) : null}
      
      <Text className={textClasses}>{title}</Text>
      
      {!loading && rightIcon && (
        <View className="ml-2">{rightIcon}</View>
      )}
    </TouchableOpacity>
  );
};

// Вспомогательная функция для объединения классов
export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};