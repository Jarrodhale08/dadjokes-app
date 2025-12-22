/**
 * Dad Jokes App - Dark Theme Color Palette
 *
 * Primary: Teal/Cyan (#14B8A6) - Modern, fun dark theme
 * Background: Dark grays - Modern dark theme
 */

export const colors = {
  // Primary brand color - Teal/Cyan
  primary: {
    DEFAULT: '#14B8A6',
    light: '#2DD4BF',
    dark: '#0D9488',
    muted: '#99F6E4',
  },

  // Background colors - Dark theme
  background: {
    DEFAULT: '#111827',    // Main background
    secondary: '#1F2937',  // Cards, elevated surfaces
    tertiary: '#374151',   // Subtle highlights
  },

  // Surface colors for cards and containers
  surface: {
    DEFAULT: '#1F2937',
    elevated: '#374151',
    overlay: '#4B5563',
  },

  // Text colors
  text: {
    primary: '#F9FAFB',    // White text
    secondary: '#D1D5DB',  // Gray-300
    tertiary: '#9CA3AF',   // Gray-400
    muted: '#6B7280',      // Gray-500
    inverse: '#111827',    // Dark text on light backgrounds
  },

  // Border colors
  border: {
    DEFAULT: '#374151',
    light: '#4B5563',
    dark: '#1F2937',
  },

  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Accent colors
  accent: {
    blue: '#60A5FA',
    purple: '#A78BFA',
    pink: '#F472B6',
    teal: '#2DD4BF',
  },

  // Special colors for the app
  mustache: '#92400E',  // Brown for mustache element
  tear: '#60A5FA',      // Blue for tear drops
} as const;

// Semantic color aliases for easier usage
export const theme = {
  // Primary actions
  buttonPrimary: colors.primary.DEFAULT,
  buttonPrimaryText: colors.text.inverse,

  // Secondary actions
  buttonSecondary: colors.surface.elevated,
  buttonSecondaryText: colors.text.primary,

  // Tab bar
  tabBarBackground: colors.background.secondary,
  tabBarActive: colors.primary.DEFAULT,
  tabBarInactive: colors.text.muted,

  // Headers
  headerBackground: colors.primary.DEFAULT,
  headerText: colors.text.inverse,

  // Cards
  cardBackground: colors.surface.DEFAULT,
  cardBorder: colors.border.DEFAULT,

  // Input fields
  inputBackground: colors.surface.DEFAULT,
  inputBorder: colors.border.DEFAULT,
  inputText: colors.text.primary,
  inputPlaceholder: colors.text.muted,

  // Status bar
  statusBarStyle: 'light' as const,
} as const;

export default colors;
