import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';

interface CardProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

function Card({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: CardProps) {
  const containerStyles = [
    styles.container,
    styles[`container_${variant}`],
    styles[`container_${size}`],
    disabled && styles.container_disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.text_disabled,
  ];

  const content = (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#EF4444' : '#FFFFFF'}
          style={styles.loader}
        />
      )}
      {title && <Text style={textStyles}>{title}</Text>}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={title || 'Card'}
        accessibilityState={{ disabled: disabled || loading }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={containerStyles}
      accessibilityRole="none"
      accessibilityLabel={title || 'Card'}
    >
      {content}
    </View>
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
  container_primary: {
    backgroundColor: '#EF4444',
    borderWidth: 0,
  },
  container_secondary: {
    backgroundColor: '#6B7280',
    borderWidth: 0,
  },
  container_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  container_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  container_danger: {
    backgroundColor: '#DC2626',
    borderWidth: 0,
  },
  container_disabled: {
    opacity: 0.5,
  },
  container_sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  container_md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  container_lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: '#EF4444',
  },
  text_ghost: {
    color: '#EF4444',
  },
  text_danger: {
    color: '#FFFFFF',
  },
  text_disabled: {
    opacity: 0.7,
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
  loader: {
    marginRight: 8,
  },
});

export default memo(Card);
export { Card };
