import React, { memo } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';

interface FormProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  accessibilityLabel?: string;
}

function Form({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  variant = 'primary',
  size = 'md',
  disabled = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  maxLength = 500,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  style,
  inputStyle,
  accessibilityLabel,
}: FormProps) {
  const containerStyle = [
    styles.container,
    size === 'sm' && styles.containerSm,
    size === 'md' && styles.containerMd,
    size === 'lg' && styles.containerLg,
    variant === 'primary' && styles.containerPrimary,
    variant === 'secondary' && styles.containerSecondary,
    variant === 'outline' && styles.containerOutline,
    variant === 'ghost' && styles.containerGhost,
    variant === 'danger' && styles.containerDanger,
    error && styles.containerError,
    disabled && styles.containerDisabled,
  ];

  const textStyle = [
    styles.input,
    size === 'sm' && styles.inputSm,
    size === 'md' && styles.inputMd,
    size === 'lg' && styles.inputLg,
    variant === 'primary' && styles.inputPrimary,
    variant === 'secondary' && styles.inputSecondary,
    variant === 'outline' && styles.inputOutline,
    variant === 'ghost' && styles.inputGhost,
    variant === 'danger' && styles.inputDanger,
    disabled && styles.inputDisabled,
    inputStyle,
  ];

  const handleChangeText = (text: string) => {
    const sanitized = text.trim().slice(0, maxLength);
    onChangeText(sanitized);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={containerStyle}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        editable={!disabled}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        maxLength={maxLength}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        accessibilityLabel={accessibilityLabel || label || placeholder}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        accessibilityRole="none"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  container: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  containerSm: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    minHeight: 36,
  },
  containerMd: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 44,
  },
  containerLg: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    minHeight: 52,
  },
  containerPrimary: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  containerSecondary: {
    borderColor: '#6B7280',
    backgroundColor: '#F9FAFB',
  },
  containerOutline: {
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  containerGhost: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  containerDanger: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  containerError: {
    borderColor: '#DC2626',
  },
  containerDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
  },
  inputSm: {
    fontSize: 14,
  },
  inputMd: {
    fontSize: 16,
  },
  inputLg: {
    fontSize: 18,
  },
  inputPrimary: {
    color: '#1F2937',
  },
  inputSecondary: {
    color: '#1F2937',
  },
  inputOutline: {
    color: '#1F2937',
  },
  inputGhost: {
    color: '#1F2937',
  },
  inputDanger: {
    color: '#DC2626',
  },
  inputDisabled: {
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
});

export { Form };
export default memo(Form);
