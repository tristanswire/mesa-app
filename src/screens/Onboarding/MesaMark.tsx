import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme';

type Props = { size?: number };

export function MesaMark({ size = 72 }: Props) {
  return (
    <View
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: radii.md },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.58 }]}>M</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: 'Inter_700Bold',
    color: colors.cream,
    lineHeight: undefined,
  },
});
