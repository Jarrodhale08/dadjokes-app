import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred. Please try again.',
  onRetry,
  retryLabel = 'Retry',
  variant = 'danger',
  size = 'md',
  disabled = false,
  style,
}: ErrorStateProps) {
  const containerStyles = [
    styles.container,
    size === 'sm' && styles.containerSm,
    size === 'lg' && styles.containerLg,
    style,
  ];

  const titleStyles = [
    styles.title,
    size === 'sm' && styles.titleSm,
    size === 'lg' && styles.titleLg,
  ];

  const messageStyles = [
    styles.message,
    size === 'sm' && styles.messageSm,
    size === 'lg' && styles.messageLg,
  ];

  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    size === 'sm' && styles.buttonSm,
    size === 'lg' && styles.buttonLg,
    disabled && styles.buttonDisabled,
  ];

  const buttonTextStyles = [
    styles.buttonText,
    styles[`buttonText_${variant}`],
    size === 'sm' && styles.buttonTextSm,
    size === 'lg' && styles.buttonTextLg,
    disabled && styles.buttonTextDisabled,
  ];

  return (
    <View style={containerStyles} accessibilityRole="alert">
      <Text style={titleStyles} accessibilityLabel={title}>
        {title}
      </Text>
      <Text style={messageStyles} accessibilityLabel={message}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={buttonStyles}
          onPress={onRetry}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          accessibilityState={{ disabled }}
        >
          <Text style={buttonTextStyles}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerSm: {
    padding: 16,
  },
  containerLg: {
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleSm: {
    fontSize: 16,
    marginBottom: 6,
  },
  titleLg: {
    fontSize: 22,
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageSm: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  messageLg: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  buttonSm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  buttonLg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 52,
  },
  button_primary: {
    backgroundColor: '#3B82F6',
  },
  button_secondary: {
    backgroundColor: '#6B7280',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_danger: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSm: {
    fontSize: 14,
  },
  buttonTextLg: {
    fontSize: 18,
  },
  buttonText_primary: {
    color: '#FFFFFF',
  },
  buttonText_secondary: {
    color: '#FFFFFF',
  },
  buttonText_outline: {
    color: '#EF4444',
  },
  buttonText_ghost: {
    color: '#EF4444',
  },
  buttonText_danger: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    opacity: 1,
  },
});

export { ErrorState };
export default memo(ErrorState);
