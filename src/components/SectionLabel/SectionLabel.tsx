import React from 'react';
import { Text } from '../Text';
import type { ColorToken } from '../../theme';

export interface SectionLabelProps {
  children: string;
  color?: ColorToken;
}

export function SectionLabel({ children, color = 'clay' }: SectionLabelProps) {
  return (
    <Text role="sectionLabel" color={color}>
      {children}
    </Text>
  );
}
