// ─────────────────────────────────────────────
// Design System LeBazare Manager v2
// Palette sombre, orange signature, échelles
// cohérentes pour toute l'application.
// ─────────────────────────────────────────────

export const COLORS = {
  // Fonds
  bg: '#0B0E17',
  surface: '#151A2B',
  surfaceLight: '#1E2438',
  surfaceHover: '#262D45',

  // Alias (compatibilité)
  card: '#151A2B',
  cardLight: '#1E2438',
  black: '#000000',
  white: '#FFFFFF',

  // Marque
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FB923C',
  primarySoft: 'rgba(249,115,22,0.14)',

  // Statuts
  success: '#22C55E',
  successSoft: 'rgba(34,197,94,0.14)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.14)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.14)',
  info: '#38BDF8',
  infoSoft: 'rgba(56,189,248,0.14)',

  // Texte
  text: '#F8FAFC',
  textSecondary: '#A6ACBF',
  textMuted: '#6B7186',
  textFaint: '#4A4F63',

  // Divers
  border: '#252B42',
  borderLight: '#303753',
  overlay: 'rgba(4,6,12,0.72)',
};

export const SIZES = {
  // Typographie
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 28,
  big: 34,

  // Espacements
  xs4: 4,
  sm8: 8,
  md12: 12,
  lg16: 16,
  xl20: 20,
  xxl24: 24,

  // Rayons
  radiusSm: 10,
  radiusMd: 14,
  radius: 16,
  radiusLg: 20,
  radiusXl: 26,

  // Composants
  buttonHeight: 48,
  rowHeight: 72,
  tabBarHeight: 64,
};

// Ombres légères (cards, FAB, sheets)
export const SHADOWS = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  fab: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const CATEGORIES = {
  Produits: { label: 'Créations', emoji: '👜', icon: 'color-palette-outline' },
  Emballages: { label: 'Emballages', emoji: '📦', icon: 'cube-outline' },
};

export const categoryMeta = (key) =>
  CATEGORIES[key] || { label: key, emoji: '🏷️', icon: 'pricetag-outline' };
