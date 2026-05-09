import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

// Deep-link wiring for the iOS Share Extension. The extension calls
// `openHostApp("import?prefilledUrl=<encoded>")` which routes here as
// `mesa://import?prefilledUrl=...`. React Navigation maps the path to the
// nested Import modal inside Main and passes the query param through as
// `route.params.prefilledUrl` — same shape ImportScreen reads from the
// AhaMoment "Import your first recipe" CTA, so no screen-side change.
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['mesa://'],
  config: {
    screens: {
      Main: {
        screens: {
          Import: {
            path: 'import',
            parse: {
              prefilledUrl: (value: string) => decodeURIComponent(value),
            },
          },
        },
      },
    },
  },
};
