import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

function Avatar({
  source,
  name,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
}: AvatarProps) {
  const sizeStyles = {
    sm: { width: 32, height: 32, borderRadius: 16 },
    md: { width: 44, height: 44, borderRadius: 22 },
    lg: { width: 64, height: 64, borderRadius: 32 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: '#EF4444' },
    secondary: { backgroundColor: '#6B7280' },
    outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#EF4444' },
    ghost: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    danger: { backgroundColor: '#DC2626' },
  };

  const textSizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: 12 },
    md: { fontSize: 16 },
    lg: { fontSize: 24 },
  };

  const textVariantStyles: Record<string, TextStyle> = {
    primary: { color: '#FFFFFF' },
    secondary: { color: '#FFFFFF' },
    outline: { color: '#EF4444' },
    ghost: { color: '#EF4444' },
    danger: { color: '#FFFFFF' },
  };

  const getInitials = (fullName: string): string => {
    const trimmed = fullName.trim().slice(0, 100);
    const parts = trimmed.split(' ').filter(part => part.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const containerStyle: ViewStyle[] = [
    styles.container,
    sizeStyles[size],
    variantStyles[variant],
    disabled && styles.disabled,
    style,
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    textSizeStyles[size],
    textVariantStyles[variant],
  ];

  const imageStyle: ImageStyle[] = [
    styles.image,
    sizeStyles[size],
  ];

  return (
    <View
      style={containerStyle}
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar for ${name}` : 'Avatar'}
    >
      {source ? (
        <Image
          source={source}
          style={imageStyle}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={textStyle}>
          {name ? getInitials(name) : '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

export { Avatar };
export default memo(Avatar);
