/**
 * Mesa Text primitive — all text in the app should use this component,
 * never raw <Text> from React Native. This enforces the token-driven type system.
 */
import React from 'react';
import { Text as RNText, type TextStyle } from 'react-native';
import { colors, typography } from '../../theme';
import type { ColorToken, TypographyRole } from '../../theme';

export interface TextProps {
  role: TypographyRole;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  style?: TextStyle;
  children: React.ReactNode;
}

export function Text({ role, color, align, numberOfLines, style, children }: TextProps) {
  const spec = typography[role];
  const resolvedColor = colors[color ?? spec.color];

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: spec.fontFamily,
          fontSize: spec.fontSize,
          fontWeight: spec.fontWeight,
          lineHeight: spec.lineHeight,
          letterSpacing: spec.letterSpacing,
          color: resolvedColor,
          textTransform: spec.textTransform,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
