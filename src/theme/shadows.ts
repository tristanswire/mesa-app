export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  /** Recipe cards, feature cards, affiliate cards */
  card: {
    shadowColor: '#1F1C19',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  /** Floating action button — more pronounced, always visible */
  fab: {
    shadowColor: '#1F1C19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  /** Primary FAB over content — deeper shadow + pairs with cream ring for contrast on busy backgrounds */
  fabStrong: {
    shadowColor: '#1F1C19',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;

export type ShadowToken = keyof typeof shadows;
