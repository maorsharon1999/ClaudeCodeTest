// Light-first design system — white/blue glassmorphism
export const theme = {
  colors: {
    // Backgrounds — white & barely-blue-tinted
    bgDeep: '#FFFFFF',
    bgSurface: '#F4F9FF',
    bgElevated: '#E8F3FF',
    bgGlass: 'rgba(255,255,255,0.78)',
    bgOverlay: 'rgba(248,252,255,0.88)',

    // Aliases for legacy compat
    bgBase: '#FFFFFF',
    bgSubtle: '#F4F9FF',
    bgWash: '#F8FBFF',
    bgDim: '#E8F3FF',
    bgTinted: '#E2EEFA',
    inputTinted: '#ECF4FF',

    // Text — dark navy on white
    textPrimary: '#0D1A27',
    textBody: '#2B3D50',
    textSecondary: '#56748E',
    textMuted: '#8AA5BE',
    textFaint: '#B5CCD8',

    // Brand — deep bright blue
    brand: '#0072CE',
    brandMuted: 'rgba(0,114,206,0.10)',

    // Accents
    accent: '#44A5FF',
    cyan: '#00B5A0',
    pink: '#D044A8',
    mint: '#30D9B0',

    // Functional
    success: '#1DB87A',
    error: '#C62828',
    warning: '#E59B10',
    disabled: '#C8D8E8',

    // Borders — very subtle blue tint
    borderDefault: 'rgba(0,80,160,0.10)',
    borderSubtle: 'rgba(0,80,160,0.06)',
    borderFocus: 'rgba(0,114,206,0.40)',

    // Input
    inputBg: '#F0F7FF',
    inputBgFocused: '#FFFFFF',

    // Legacy compat
    badgePurpleBg: 'rgba(0,114,206,0.10)',
    toastBg: '#F4F9FF',
    orbGlow: 'rgba(0,114,206,0.18)',
  },

  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },

  radii: { sm: 8, md: 12, lg: 20, xl: 24, pill: 999 },

  shadows: {
    card: {
      shadowColor: '#0050A0',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 3,
    },
    orb: {
      shadowColor: '#0072CE',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 8,
    },
    buttonPress: {
      shadowColor: '#0072CE',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.20,
      shadowRadius: 10,
      elevation: 4,
    },
    inputBar: {
      shadowColor: '#0050A0',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    glow: {
      shadowColor: '#0072CE',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.20,
      shadowRadius: 14,
      elevation: 6,
    },
  },

  gradients: {
    brand: ['#0080E8', '#0072CE', '#005EB0'],
    brandGlow: ['rgba(0,114,206,0.20)', 'rgba(0,114,206,0)'],
    accent: ['#44A5FF', '#0080E8'],
    accentWarm: ['#0072CE', '#5B7AFF'],
    success: ['#30D9B0', '#1DB87A'],
    surfaceGlass: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.65)'],
    cyanToMint: ['#00B5A0', '#30D9B0'],
    radarPulse: ['rgba(0,114,206,0.15)', 'rgba(0,114,206,0)'],
    purpleToCoralH: ['#0072CE', '#44A5FF'],
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
