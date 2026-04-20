export const colors = {
  /** Primary background */
  cream: '#F7F2EA',
  /** Secondary surface, cards */
  oat: '#E9DDCF',
  /** DECORATIVE ONLY — fails WCAG AA, never for text or functional icons */
  clay: '#C98F63',
  /** Primary CTA, logo. WCAG AA on cream (6.97:1). Darkened from legacy #A85D3B. */
  terracotta: '#8A3A1E',
  /** Secondary accent, 18pt+ labels only (fails AA at body size) */
  olive: '#6F785B',
  /** Body text, captions. WCAG AA on cream (6.72:1). */
  oliveDark: '#4F5840',
  /** Cook Mode dark surface. AAA pair with cream (9.73:1). */
  pine: '#364032',
  /** Primary text. AAA on cream (15.22:1). */
  ink: '#1F1C19',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
