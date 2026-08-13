module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['inline-import', { extensions: ['.sql'] }],
      // Reanimated 4 ships its Babel plugin under react-native-worklets (it was
      // 'react-native-reanimated/plugin' in v3). It MUST stay LAST in this list
      // — it rewrites worklet function bodies and has to see the output of every
      // other transform. Adding a plugin after it silently breaks animations at
      // runtime with no build error.
      'react-native-worklets/plugin',
    ],
  };
};
