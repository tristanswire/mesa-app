import { openHostApp } from 'expo-share-extension';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// Mesa's share extension does no custom UI per phase doc — its only job is
// to grab the URL from the share intent and hand it back to the main app via
// a deep link, then dismiss. The main app's existing Import flow takes over.

type Props = {
  url?: string;
  text?: string;
};

const BACKGROUND = '#F7F2EA'; // colors.cream — extension can't import from src/theme
const INK = '#1F1C19'; // colors.ink

export default function ShareExtension({ url, text }: Props) {
  const handed = useRef(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (handed.current) return;

    // Prefer `url` (Safari share button on a web URL). Fall back to `text` if a
    // URL got passed in as text — rare but seen with messages app shares.
    const candidate = url ?? text;
    if (!candidate) {
      setErrored(true);
      return;
    }

    handed.current = true;
    try {
      // Match the param name ImportScreen + linking config expect.
      openHostApp(`import?prefilledUrl=${encodeURIComponent(candidate)}`);
    } catch (e) {
      console.error('[share-ext] openHostApp failed', e);
      setErrored(true);
    }
  }, [url, text]);

  return (
    <View style={styles.root}>
      {errored ? (
        <Text allowFontScaling={false} style={styles.label}>
          Couldn't open Mesa.
        </Text>
      ) : (
        <>
          <ActivityIndicator color={INK} />
          <Text allowFontScaling={false} style={styles.label}>
            Opening Mesa…
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BACKGROUND,
    gap: 12,
    padding: 24,
  },
  label: {
    fontSize: 16,
    color: INK,
  },
});
