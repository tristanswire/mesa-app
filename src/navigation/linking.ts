import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['mesa://'],
  config: {
    screens: {
      // Phase 3 fills this out when the Share Extension is wired
    },
  },
};
