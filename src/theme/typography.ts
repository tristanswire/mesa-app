import type { ColorToken } from './colors';

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight?: number;
  letterSpacing?: number;
  color: ColorToken;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
}

export type TypographyRole =
  | 'display'
  | 'headline'
  | 'sectionLabel'
  | 'body'
  | 'caption'
  | 'cookModeBody'
  | 'cookModeStepNumber'
  | 'cookModeIngredientChip';

/**
 * Font family strings match @expo-google-fonts/inter export names.
 * Pass strokeWidth={1.5} when using Lucide icons (V2 spec default).
 */
const Inter = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography: Record<TypographyRole, TypographyStyle> = {
  /** Hero text — recipe titles, screen headers */
  display: {
    fontFamily: Inter.semiBold,
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1,
    color: 'ink',
  },
  /** Section and card headers */
  headline: {
    fontFamily: Inter.semiBold,
    fontSize: 24,
    fontWeight: '600',
    color: 'ink',
  },
  /** Allcaps category labels — rendered in clay (decorative, large enough) */
  sectionLabel: {
    fontFamily: Inter.semiBold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: 'clay',
    textTransform: 'uppercase',
  },
  /** Standard reading text */
  body: {
    fontFamily: Inter.regular,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 26, // 1.6 × 16
    color: 'ink',
  },
  /** Supporting metadata, timestamps */
  caption: {
    fontFamily: Inter.regular,
    fontSize: 13,
    fontWeight: '400',
    color: 'oliveDark',
  },
  /** Cook Mode step instructions — glanceable from across the kitchen */
  cookModeBody: {
    fontFamily: Inter.medium,
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 33, // 1.5 × 22
    color: 'white',
  },
  /** Cook Mode step counter — oversized for at-a-glance progress */
  cookModeStepNumber: {
    fontFamily: Inter.bold,
    fontSize: 48,
    fontWeight: '700',
    color: 'white',
  },
  /** Cook Mode ingredient chips on pine surface */
  cookModeIngredientChip: {
    fontFamily: Inter.bold,
    fontSize: 15,
    fontWeight: '700',
    color: 'oat',
  },
} as const;
