import { DefaultTheme } from 'react-native-paper';

export const COLORS = {
  PRIMARY: '#8B0000',     // Deeper Church Red
  SECONDARY: '#D4AF37',   // Richer Byzantine Gold
  TERTIARY: '#1B3661',    // Orthodox Blue
  BACKGROUND: '#F5F3E8',  // Warm Parchment
  SURFACE: '#FFFFFF',     // Pure White
  TEXT: '#2C1810',        // Deep Brown Text
  TEXT_LIGHT: '#FFFFFF',  // White Text
  BORDER: '#D4AF37',      // Gold Border
  ERROR: '#FF3B30',
  SUCCESS: '#34C759',
  WARNING: '#FF9500',
  CARD_BG: '#F8F4E9',    // Lighter Parchment for Cards
};

export const SHADOWS = {
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  }
};

export const CARD_STYLES = {
  orthodox: {
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 15,
    backgroundColor: COLORS.CARD_BG,
    ...SHADOWS.default,
    padding: 16,
    borderStyle: 'solid',
    // Paper-like texture through subtle inner shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    borderWidth: 3,
    borderColor: COLORS.SECONDARY,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    ...SHADOWS.large,
    marginVertical: 8,
    // Add subtle texture through inner shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  }
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.PRIMARY,
    accent: COLORS.SECONDARY,
    background: COLORS.BACKGROUND,
    surface: COLORS.SURFACE,
    error: COLORS.ERROR,
    text: COLORS.TEXT,
  },
  roundness: 12,
};

export const navigationTheme = {
  dark: false,
  colors: {
    primary: COLORS.PRIMARY,
    background: COLORS.BACKGROUND,
    card: COLORS.SURFACE,
    text: COLORS.TEXT,
    border: COLORS.BORDER,
    notification: COLORS.PRIMARY,
  },
}; 