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
}

export function AffiliateCard({
  productName,
  price,
  partner,
  imageSource,
  onPress,
}: AffiliateCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${productName}, ${price}, via ${partner}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {imageSource ? (
          <Image source={imageSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.thumbnailPlaceholder]} />
        )}
      </View>

      {/* Text stack */}
      <View style={styles.textStack}>
        <Text role="body" style={styles.productName} numberOfLines={2}>
          {productName}
        </Text>
        <Text role="caption" color="oliveDark">
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
    backgroundColor: colors.oat,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbnailPlaceholder: {
    backgroundColor: colors.oliveDark,
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
