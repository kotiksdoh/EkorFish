import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
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
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary border-primary',
    secondary: 'bg-secondary border-secondary',
    outline: 'bg-transparent border-primary border',
    ghost: 'bg-transparent border-transparent',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 rounded-lg',
    md: 'px-6 py-3 rounded-xl',
    lg: 'px-8 py-4 rounded-2xl',
  };

  const textSizeStyles: Record<ButtonSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const textColorStyles: Record<ButtonVariant, string> = {
    primary: 'text-white',
    secondary: 'text-primary',
    outline: 'text-primary',
    ghost: 'text-primary',
  };

  const baseStyles = cn(
    'flex-row items-center justify-center border',
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-50' : 'active:opacity-80',
    style as string
  );

  const textStyles = cn(
    'font-semibold text-center',
    textSizeStyles[size],
    textColorStyles[variant]
  );

  return (
    <TouchableOpacity
      className={baseStyles}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : '#203686'}
          size="small"
          className="mr-2"
        />
      ) : leftIcon ? (
        <View className="mr-2">{leftIcon}</View>
      ) : null}
      
      <Text className={textStyles}>{title}</Text>
      
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