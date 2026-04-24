// Iridescent glass design system — neutral sky/mint/sand/lilac palette
export const theme = {
  colors: {
    // Core ink (dark text on light glass)
    ink:       '#0E1A24',
    inkSoft:   'rgba(14,26,36,0.72)',
    inkMuted:  'rgba(14,26,36,0.60)',
    inkFaint:  'rgba(14,26,36,0.42)',
    inkGhost:  'rgba(14,26,36,0.18)',

    // Soft iridescent accents
    sky:       '#9FC4E8',
    skyDeep:   '#5D90BF',
    mint:      '#9FD4C2',
    mintDeep:  '#5AA892',
    peach:     '#F2C9A5',
    lilac:     '#B8B5D6',
    sand:      '#E8DDC8',

    // Functional
    live:      '#5AB992',
    warn:      '#D9A35A',

    // Glass surface tokens
    glassTint:   'rgba(255,255,255,0.34)',
    glassBorder: 'rgba(255,255,255,0.55)',

    // Gradient stops (arrays)
    skyGrad:   ['#CFE1EE', '#D6DCE6', '#DEDAE2'],
    dawnGrad:  ['#E4E9ED', '#EAE2D6', '#DCD9CF'],
    duskGrad:  ['#BDC8D4', '#B8B7C7', '#A9B2C0'],
    nightGrad: ['#1F2A38', '#2A3648', '#36455A'],
    mintGrad:  ['#D3E3DE', '#CFDCE2', '#D6D8DE'],

    // Backgrounds — cool neutral
    bgDeep:    '#EEF1F5',
    bgSurface: '#E6ECF2',
    bgElevated:'#D8E3EC',
    bgGlass:   'rgba(255,255,255,0.34)',
    bgOverlay: 'rgba(238,241,245,0.88)',

    // Aliases for legacy compat
    bgBase:    '#EEF1F5',
    bgSubtle:  '#E6ECF2',
    bgWash:    '#EEF1F5',
    bgDim:     '#D8E3EC',
    bgTinted:  '#D8E3EC',
    inputTinted:'rgba(255,255,255,0.34)',

    // Text — mapped to ink tokens for consistency
    textPrimary:   '#0E1A24',
    textBody:      'rgba(14,26,36,0.72)',
    textSecondary: 'rgba(14,26,36,0.60)',
    textMuted:     'rgba(14,26,36,0.42)',
    textFaint:     'rgba(14,26,36,0.18)',

    // Brand — sky deep (no more bright blue)
    brand:     '#5D90BF',
    brandMuted:'rgba(93,144,191,0.10)',

    // Accents — mapped to palette
    accent:    '#9FD4C2',
    cyan:      '#5AA892',
    pink:      '#F2C9A5',

    // Functional
    success:  '#5AB992',
    error:    '#C62828',
    warning:  '#D9A35A',
    disabled: '#C8D8E4',

    // Borders — glass treatment
    borderDefault: 'rgba(255,255,255,0.55)',
    borderSubtle:  'rgba(255,255,255,0.35)',
    borderFocus:   'rgba(93,144,191,0.50)',

    // Input
    inputBg:       'rgba(255,255,255,0.34)',
    inputBgFocused:'rgba(255,255,255,0.55)',

    // Legacy compat
    badgePurpleBg: 'rgba(93,144,191,0.10)',
    toastBg:       '#E6ECF2',
    orbGlow:       'rgba(93,144,191,0.18)',
  },

  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },

  radii: { sm: 8, md: 12, lg: 20, xl: 24, pill: 999 },

  shadows: {
    card: {
      shadowColor: 'rgba(100,125,160,1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 3,
    },
    orb: {
      shadowColor: 'rgba(100,125,160,1)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.20,
      shadowRadius: 28,
      elevation: 8,
    },
    buttonPress: {
      shadowColor: 'rgba(100,125,160,1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
    inputBar: {
      shadowColor: 'rgba(100,125,160,1)',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    glow: {
      shadowColor: 'rgba(100,125,160,1)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
      elevation: 6,
    },
  },

  gradients: {
    brand:         ['#7AADCF', '#5D90BF', '#4A7AA0'],
    brandGlow:     ['rgba(93,144,191,0.20)', 'rgba(93,144,191,0)'],
    accent:        ['#9FD4C2', '#5AA892'],
    accentWarm:    ['#9FC4E8', '#B8B5D6'],
    success:       ['#9FD4C2', '#5AB992'],
    surfaceGlass:  ['rgba(255,255,255,0.60)', 'rgba(255,255,255,0.34)'],
    cyanToMint:    ['#9FC4E8', '#9FD4C2'],
    radarPulse:    ['rgba(93,144,191,0.15)', 'rgba(93,144,191,0)'],
    purpleToCoralH:['#9FC4E8', '#B8B5D6'],
  },

  typography: {
    displayLg: { fontSize: 44, fontWeight: '800', letterSpacing: -1.2, fontFamily: '"Plus Jakarta Sans", system-ui' },
    displayMd: { fontSize: 36, fontWeight: '700', fontFamily: '"Plus Jakarta Sans", system-ui' },
    titleLg:   { fontSize: 22, fontWeight: '700', fontFamily: '"Plus Jakarta Sans", system-ui' },
    titleMd:   { fontSize: 24, fontWeight: '700', fontFamily: '"Plus Jakarta Sans", system-ui' },
    bodyLg:    { fontSize: 17, fontWeight: '600', fontFamily: '"Plus Jakarta Sans", system-ui' },
    bodyMd:    { fontSize: 16,                    fontFamily: '"Plus Jakarta Sans", system-ui' },
    bodySm:    { fontSize: 13,                    fontFamily: '"Plus Jakarta Sans", system-ui' },
    caption:   { fontSize: 13,                    fontFamily: '"Plus Jakarta Sans", system-ui' },
    micro:     { fontSize: 12,                    fontFamily: '"Plus Jakarta Sans", system-ui' },
  },
};
