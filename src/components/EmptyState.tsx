import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

function EmptyState({
  title = 'No Items Found',
  message = 'There are no items to display at this time.',
  icon = 'file-tray-outline',
  variant = 'primary',
  size = 'md',
  style,
}: EmptyStateProps) {
  const containerStyles = [
    styles.container,
    styles[`container_${size}`],
    style,
  ];

  const iconStyles = [
    styles.icon,
    styles[`icon_${variant}`],
    styles[`icon_${size}`],
  ];

  const titleStyles = [
    styles.title,
    styles[`title_${variant}`],
    styles[`title_${size}`],
  ];

  const messageStyles = [
    styles.message,
    styles[`message_${variant}`],
    styles[`message_${size}`],
  ];

  const iconSizeMap = {
    sm: 48,
    md: 64,
    lg: 80,
  };

  return (
    <View
      style={containerStyles}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${message}`}
    >
      <Ionicons
        name={icon}
        size={iconSizeMap[size]}
        style={iconStyles}
      />
      <Text style={titleStyles}>{title}</Text>
      <Text style={messageStyles}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 200,
  },
  container_sm: {
    padding: 16,
    minHeight: 150,
  },
  container_md: {
    padding: 24,
    minHeight: 200,
  },
  container_lg: {
    padding: 32,
    minHeight: 250,
  },
  icon: {
    marginBottom: 16,
  },
  icon_primary: {
    color: '#EF4444',
  },
  icon_secondary: {
    color: '#6B7280',
  },
  icon_outline: {
    color: '#EF4444',
  },
  icon_ghost: {
    color: '#9CA3AF',
  },
  icon_danger: {
    color: '#DC2626',
  },
  icon_sm: {
    marginBottom: 12,
  },
  icon_md: {
    marginBottom: 16,
  },
  icon_lg: {
    marginBottom: 20,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  title_primary: {
    color: '#1F2937',
    fontSize: 18,
  },
  title_secondary: {
    color: '#374151',
    fontSize: 18,
  },
  title_outline: {
    color: '#1F2937',
    fontSize: 18,
  },
  title_ghost: {
    color: '#4B5563',
    fontSize: 18,
  },
  title_danger: {
    color: '#991B1B',
    fontSize: 18,
  },
  title_sm: {
    fontSize: 16,
    marginBottom: 6,
  },
  title_md: {
    fontSize: 18,
    marginBottom: 8,
  },
  title_lg: {
    fontSize: 20,
    marginBottom: 10,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
  },
  message_primary: {
    color: '#6B7280',
    fontSize: 14,
  },
  message_secondary: {
    color: '#6B7280',
    fontSize: 14,
  },
  message_outline: {
    color: '#6B7280',
    fontSize: 14,
  },
  message_ghost: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  message_danger: {
    color: '#B91C1C',
    fontSize: 14,
  },
  message_sm: {
    fontSize: 12,
    lineHeight: 18,
  },
  message_md: {
    fontSize: 14,
    lineHeight: 20,
  },
  message_lg: {
    fontSize: 16,
    lineHeight: 22,
  },
});

export { EmptyState };
export default memo(EmptyState);
