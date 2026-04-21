import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radii } from '../../theme';
import type { ColorToken } from '../../theme';

export interface ProgressBarProps {
  progress: number;
  tint?: ColorToken;
  trackColor?: ColorToken;
  height?: number;
}

export function ProgressBar({
  progress,
  tint = 'terracotta',
  trackColor = 'oat',
  height = 4,
}: ProgressBarProps) {
  const width = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress, width]);

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: colors[trackColor], height, borderRadius: radii.pill },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: colors[tint],
            height,
            borderRadius: radii.pill,
            width: width.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {},
});
