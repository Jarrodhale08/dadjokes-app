import React, { memo } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

function Input({
  label,
  error,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  ...textInputProps
}: InputProps) {
  const containerStyle = [
    styles.container,
    styles[`container_${variant}`],
    styles[`container_${size}`],
    disabled && styles.container_disabled,
    error && styles.container_error,
    style,
  ];

  const inputStyle = [
    styles.input,
    styles[`input_${size}`],
    disabled && styles.input_disabled,
  ];

  const labelStyle = [
    styles.label,
    styles[`label_${size}`],
    error && styles.label_error,
  ];

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={labelStyle} accessibilityRole="text">
          {label}
        </Text>
      )}
      <TextInput
        {...textInputProps}
        style={inputStyle}
        editable={!disabled}
        accessibilityLabel={label || textInputProps.placeholder}
        accessibilityState={{ disabled }}
        placeholderTextColor="#9CA3AF"
      />
      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    borderRadius: 8,
    borderWidth: 1,
  },
  container_primary: {
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
  },
  container_secondary: {
    borderColor: '#6B7280',
    backgroundColor: '#FFFFFF',
  },
  container_outline: {
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  container_ghost: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  container_danger: {
    borderColor: '#DC2626',
    backgroundColor: '#FFFFFF',
  },
  container_sm: {
    minHeight: 36,
  },
  container_md: {
    minHeight: 44,
  },
  container_lg: {
    minHeight: 52,
  },
  container_disabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  container_error: {
    borderColor: '#DC2626',
  },
  input: {
    paddingHorizontal: 12,
    color: '#1F2937',
    fontWeight: '400',
  },
  input_sm: {
    fontSize: 14,
    paddingVertical: 8,
  },
  input_md: {
    fontSize: 16,
    paddingVertical: 12,
  },
  input_lg: {
    fontSize: 18,
    paddingVertical: 14,
  },
  input_disabled: {
    color: '#9CA3AF',
  },
  label: {
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  label_sm: {
    fontSize: 12,
  },
  label_md: {
    fontSize: 14,
  },
  label_lg: {
    fontSize: 16,
  },
  label_error: {
    color: '#DC2626',
  },
  error: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '400',
  },
});

export { Input };
export default memo(Input);
