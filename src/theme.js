export const gradientColors = {
  primary: ['#833AB4', '#E1306C', '#F77737'],
  primarySubtle: ['#833AB420', '#E1306C20', '#F7773720'],
  button: ['#833AB4', '#C13584', '#F77737'],
  header: ['#405DE6', '#833AB4', '#E1306C', '#F77737'],
};

export const lightTheme = {
  mode: 'light',
  background: '#F8F9FB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardSubtle: '#F1F5F9',
  border: '#E2E8F0',
  borderFocus: '#E1306C',
  primary: '#E1306C',
  primaryDark: '#833AB4',
  accent: '#F77737',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  iconColor: '#475569',
  inputBg: '#F8FAFC',
  badgeBg: '#F1F5F9',
  badgeText: '#475569',
  shadow: '#000000',
  statusBar: 'dark',
};

export const darkTheme = {
  mode: 'dark',
  background: '#0D0E12',
  surface: '#16181F',
  card: '#16181F',
  cardSubtle: '#1E212B',
  border: '#2A2D3A',
  borderFocus: '#E1306C',
  primary: '#E1306C',
  primaryDark: '#833AB4',
  accent: '#F77737',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  iconColor: '#94A3B8',
  inputBg: '#1E212B',
  badgeBg: '#2A2D3A',
  badgeText: '#CBD5E1',
  shadow: '#000000',
  statusBar: 'light',
};

// Default export alias for backward compatibility or default light theme
export const colors = lightTheme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  titleLarge: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  titleMedium: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  titleSmall: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: '500', lineHeight: 14 },
};
