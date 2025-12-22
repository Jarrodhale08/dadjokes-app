import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

function Button({
  title = 'Button',
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.container,
      ...styles[`container_${size}`],
    };

    if (disabled || loading) {
      return { ...baseStyle, opacity: 0.5 };
    }

    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: '#EF4444' };
      case 'secondary':
        return { ...baseStyle, backgroundColor: '#6B7280' };
      case 'outline':
        return { ...baseStyle, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#EF4444' };
      case 'ghost':
        return { ...baseStyle, backgroundColor: 'transparent' };
      case 'danger':
        return { ...baseStyle, backgroundColor: '#DC2626' };
      default:
        return { ...baseStyle, backgroundColor: '#EF4444' };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...styles.text,
      ...styles[`text_${size}`],
    };

    if (variant === 'outline') {
      return { ...baseStyle, color: '#EF4444' };
    }

    if (variant === 'ghost') {
      return { ...baseStyle, color: '#EF4444' };
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#EF4444' : '#FFFFFF'} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  container_sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  container_md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  container_lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 52,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  text_sm: {
    fontSize: 14,
  },
  text_md: {
    fontSize: 16,
  },
  text_lg: {
    fontSize: 18,
  },
});

export { Button };
export default memo(Button);
