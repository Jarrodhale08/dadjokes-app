import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

function Header({
  title = 'Header',
  subtitle,
  variant = 'primary',
  size = 'md',
  style,
}: HeaderProps) {
  const containerStyle = [
    styles.container,
    styles[`container_${variant}`],
    styles[`container_${size}`],
    style,
  ];

  const titleStyle = [
    styles.title,
    styles[`title_${variant}`],
    styles[`title_${size}`],
  ];

  const subtitleStyle = [
    styles.subtitle,
    styles[`subtitle_${variant}`],
    styles[`subtitle_${size}`],
  ];

  return (
    <View style={containerStyle} accessibilityRole="header">
      <Text style={titleStyle} accessibilityLabel={title}>
        {title}
      </Text>
      {subtitle && (
        <Text style={subtitleStyle} accessibilityLabel={subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
  },
  container_primary: {
    backgroundColor: '#EF4444',
  },
  container_secondary: {
    backgroundColor: '#6B7280',
  },
  container_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  container_ghost: {
    backgroundColor: 'transparent',
  },
  container_danger: {
    backgroundColor: '#DC2626',
  },
  container_sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  container_md: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  container_lg: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title_primary: {
    color: '#FFFFFF',
  },
  title_secondary: {
    color: '#FFFFFF',
  },
  title_outline: {
    color: '#EF4444',
  },
  title_ghost: {
    color: '#1F2937',
  },
  title_danger: {
    color: '#FFFFFF',
  },
  title_sm: {
    fontSize: 18,
    lineHeight: 24,
  },
  title_md: {
    fontSize: 24,
    lineHeight: 32,
  },
  title_lg: {
    fontSize: 32,
    lineHeight: 40,
  },
  subtitle: {
    fontWeight: '400',
    marginTop: 4,
  },
  subtitle_primary: {
    color: '#FEE2E2',
  },
  subtitle_secondary: {
    color: '#E5E7EB',
  },
  subtitle_outline: {
    color: '#6B7280',
  },
  subtitle_ghost: {
    color: '#6B7280',
  },
  subtitle_danger: {
    color: '#FEE2E2',
  },
  subtitle_sm: {
    fontSize: 12,
    lineHeight: 16,
  },
  subtitle_md: {
    fontSize: 14,
    lineHeight: 20,
  },
  subtitle_lg: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export { Header };
export default memo(Header);
