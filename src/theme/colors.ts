export const Colors = {
  // Pure Duolingo canvas & surface colors
  bg: '#FFFFFF',
  bgLight: '#F7F7F7',
  bgGradientStart: '#FFFFFF',
  bgGradientEnd: '#F7F7F7',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  cardLight: '#F7F7F7',
  cardHighlight: '#DDF4FF',
  cardActiveBorder: '#84D8FF',

  // Duolingo high-contrast rounded typography
  text: '#4B4B4B',
  textSecondary: '#777777',
  textDim: '#AFAFAF',
  textFaint: '#D1D5DB',
  textWhite: '#FFFFFF',

  // Duolingo 3D Tactile Palettes (Authentic Hex Codes)
  // Green (Duo Feather / Success / Continue)
  greenFace: '#58CC02',
  greenLip: '#58A700',
  greenDark: '#46A302',
  greenLight: '#D7FFB8',
  greenGlow: 'rgba(88, 204, 2, 0.25)',

  // Blue (Action / Gems / Selected Cards)
  blueFace: '#1CB0F6',
  blueLip: '#1899D6',
  blueDark: '#0F82BC',
  blueLight: '#DDF4FF',
  blueGlow: 'rgba(28, 176, 246, 0.25)',

  // Orange / Amber (Streak Flame / Timer)
  orangeFace: '#FF9600',
  orangeLip: '#E07800',
  orangeDark: '#CC6800',
  orangeLight: '#FFF0DB',
  orangeGlow: 'rgba(255, 150, 0, 0.25)',
  amberFace: '#FF9600',
  amberLip: '#E07800',

  // Red (Hearts / Incorrect / Urgent)
  redFace: '#FF4B4B',
  redLip: '#EA2B2B',
  redDark: '#D61818',
  redLight: '#FFDFE0',
  redGlow: 'rgba(255, 75, 75, 0.25)',

  // Gold (Crowns / Stars / Mastery)
  goldFace: '#FFC800',
  goldLip: '#E5A500',
  goldDark: '#C98E00',
  goldLight: '#FFF5CC',
  goldGlow: 'rgba(255, 200, 0, 0.25)',

  // Purple (XP Blitz / League / Dojo)
  purpleFace: '#CE82FF',
  purpleLip: '#A559D8',
  purpleDark: '#8C3CC2',
  purpleLight: '#F6E6FF',
  purpleGlow: 'rgba(206, 130, 255, 0.25)',

  // Neutral / Locked
  lockedFace: '#E5E5E5',
  lockedLip: '#CECECE',
  neutralFace: '#FFFFFF',
  neutralLip: '#E5E5E5',
  neutralBorder: '#E5E5E5',

  // Accents
  yellowNeon: '#FFDE37',
  cyanNeon: '#2CE5FF',
  pinkNeon: '#FF64B2',
} as const;

export const Radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  pill: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  glowGreen: {
    shadowColor: Colors.greenFace,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  glowGold: {
    shadowColor: Colors.goldFace,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
};
