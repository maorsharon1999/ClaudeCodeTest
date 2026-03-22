// Dark-first design system
export const theme = {
  colors: {
    // Backgrounds
    bgDeep: '#0A0A14',
    bgSurface: '#141422',
    bgElevated: '#1C1C30',
    bgGlass: 'rgba(255,255,255,0.06)',
    bgOverlay: 'rgba(10,10,20,0.85)',

    // Aliases for legacy compat (dark equivalents)
    bgBase: '#0A0A14',
    bgSubtle: '#141422',
    bgWash: '#0F0F1A',
    bgDim: '#1C1C30',
    bgTinted: '#1A1A2E',
    inputTinted: '#1E1E36',

    // Text
    textPrimary: '#F5F5F7',
    textBody: '#E0E0E8',
    textSecondary: '#9898AA',
    textMuted: '#6B6B80',
    textFaint: '#4A4A5C',

    // Brand
    brand: '#7B61FF',
    brandMuted: 'rgba(123,97,255,0.15)',

    // Accents
    accent: '#FF6C47',
    cyan: '#00D4AA',
    pink: '#FF5C93',
    mint: '#4AEDC4',

    // Functional
    success: '#4AEDC4',
    error: '#FF5C5C',
    warning: '#FFBB33',
    disabled: '#3A3A50',

    // Borders
    borderDefault: 'rgba(255,255,255,0.08)',
    borderSubtle: 'rgba(255,255,255,0.05)',
    borderFocus: 'rgba(123,97,255,0.5)',

    // Input
    inputBg: '#1A1A2E',
    inputBgFocused: '#1E1E36',

    // Legacy compat
    badgePurpleBg: 'rgba(123,97,255,0.15)',
    toastBg: '#1C1C30',
    orbGlow: 'rgba(123,97,255,0.25)',
  },

  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },

  radii: { sm: 8, md: 12, lg: 20, xl: 24, pill: 999 },

  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    orb: {
      shadowColor: '#7B61FF',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    },
    buttonPress: {
      shadowColor: '#7B61FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    inputBar: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    glow: {
      shadowColor: '#7B61FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  gradients: {
    brand: ['#8B71FF', '#7B61FF', '#6851EE'],
    brandGlow: ['rgba(123,97,255,0.3)', 'rgba(123,97,255,0)'],
    accent: ['#FF8C6C', '#FF6C47'],
    accentWarm: ['#FF6C47', '#FF5C93'],
    success: ['#5DC060', '#4AEDC4'],
    surfaceGlass: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
    cyanToMint: ['#00D4AA', '#4AEDC4'],
    radarPulse: ['rgba(123,97,255,0.2)', 'rgba(123,97,255,0)'],
    purpleToCoralH: ['#7B61FF', '#FF6C47'],
  },

  typography: {
    displayLg: { fontSize: 40, fontWeight: '700', letterSpacing: -0.5 },
    displayMd: { fontSize: 36, fontWeight: '700' },
    titleLg: { fontSize: 22, fontWeight: '700' },
    titleMd: { fontSize: 24, fontWeight: '700' },
    bodyLg: { fontSize: 17, fontWeight: '600' },
    bodyMd: { fontSize: 16 },
    bodySm: { fontSize: 13 },
    caption: { fontSize: 13 },
    micro: { fontSize: 12 },
  },
};
