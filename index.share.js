import { AppRegistry } from 'react-native';

import ShareExtension from './ShareExtension';

// IMPORTANT: the first argument to registerComponent must be "shareExtension".
// expo-share-extension hard-codes that registry key.
AppRegistry.registerComponent('shareExtension', () => ShareExtension);
