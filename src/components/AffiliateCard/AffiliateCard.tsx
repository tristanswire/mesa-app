import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme';
import { Text } from '../Text';

export interface AffiliateCardProps {
  productName: string;
  price: string;
  partner: string;
  imageSource?: ImageSourcePropType;
  onPress: () => void;
  theme?: 'light' | 'dark';
}

export function AffiliateCard({
  productName,
  price,
  partner,
  imageSource,
  onPress,
  theme = 'light',
}: AffiliateCardProps) {
  const isDark = theme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${productName}, ${price}, via ${partner}`}
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        pressed && styles.pressed,
      ]}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {imageSource ? (
          <Image source={imageSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              isDark ? styles.thumbnailPlaceholderDark : styles.thumbnailPlaceholderLight,
            ]}
          />
        )}
      </View>

      {/* Text stack */}
      <View style={styles.textStack}>
        <Text
          role="body"
          color={isDark ? 'cream' : 'ink'}
          style={styles.productName}
          numberOfLines={2}
        >
          {productName}
        </Text>
        <Text role="caption" color={isDark ? 'creamMuted' : 'oliveDark'}>
          {price}
        </Text>
      </View>

      {/* Partner CTA */}
      <Text role="caption" color="terracotta" style={styles.partner}>
        {`via ${partner} →`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  cardLight: {
    backgroundColor: colors.oat,
  },
  cardDark: {
    // cream at 8% over pine — "raised card" effect without a new token
    backgroundColor: 'rgba(247, 242, 234, 0.12)',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbnailPlaceholderLight: {
    backgroundColor: colors.oliveDark,
    opacity: 0.15,
  },
  thumbnailPlaceholderDark: {
    backgroundColor: colors.cream,
    opacity: 0.15,
  },
  textStack: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontWeight: '600',
  },
  partner: {
    flexShrink: 0,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.85,
  },
});
