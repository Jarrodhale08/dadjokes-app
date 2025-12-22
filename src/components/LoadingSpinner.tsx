import React, { memo } from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';

interface LoadingSpinnerProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

function LoadingSpinner({
  variant = 'primary',
  size = 'md',
  style,
}: LoadingSpinnerProps) {
  const getColor = (): string => {
    switch (variant) {
      case 'primary':
        return '#EF4444';
      case 'secondary':
        return '#6B7280';
      case 'outline':
        return '#EF4444';
      case 'ghost':
        return '#6B7280';
      case 'danger':
        return '#EF4444';
      default:
        return '#EF4444';
    }
  };

  const getSize = (): 'small' | 'large' => {
    switch (size) {
      case 'sm':
        return 'small';
      case 'lg':
        return 'large';
      default:
        return 'small';
    }
  };

  const getContainerSize = (): number => {
    switch (size) {
      case 'sm':
        return 24;
      case 'md':
        return 32;
      case 'lg':
        return 44;
      default:
        return 32;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { minHeight: getContainerSize(), minWidth: getContainerSize() },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <ActivityIndicator size={getSize()} color={getColor()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { LoadingSpinner };
export default memo(LoadingSpinner);
