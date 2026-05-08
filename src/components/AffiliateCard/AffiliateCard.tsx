import { ExternalLink } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { buildAffiliateUrl, buildPartnerSearchUrl } from '../../data/affiliate';
import { recordClick, type ClickSource } from '../../data/clicks';
import { colors, radii, shadows, spacing } from '../../theme';
import { Text } from '../Text';

export interface AffiliateCardProps {
  productName: string;
  price: string;
  partner: string;
  imageSource?: ImageSourcePropType;
  theme?: 'light' | 'dark';
  // Click context — when all four are provided, the card handles its own
  // press: records the click and opens the partner URL via system browser.
  toolId?: string;
  recipeId?: string;
  affiliateUrl?: string | null;
  source?: ClickSource;
  // Fallback for surfaces that don't track clicks (e.g. the Showcase preview).
  onPress?: () => void;
}

export function AffiliateCard({
  productName,
  price,
  partner,
  imageSource,
  theme = 'light',
  toolId,
  recipeId,
  affiliateUrl,
  source,
  onPress,
}: AffiliateCardProps) {
  const isDark = theme === 'dark';

  const handlePress = async () => {
    if (toolId && recipeId && source) {
      // Fire-and-forget: never await tracking before the linkout.
      void recordClick({ toolId, recipeId, partner, source });

      const baseUrl = affiliateUrl ?? buildPartnerSearchUrl(productName, partner);
      const finalUrl = buildAffiliateUrl(baseUrl, partner);

      try {
        const supported = await Linking.canOpenURL(finalUrl);
        if (supported) {
          await Linking.openURL(finalUrl);
        } else {
          console.error('[affiliate] cannot open URL:', finalUrl);
        }
      } catch (e) {
        console.error('[affiliate] openURL failed:', e);
      }
      return;
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${productName}, ${price}, via ${partner}`}
      hitSlop={4}
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

      {/* External-link icon — bottom-right corner */}
      <View style={styles.externalIconWrapper} pointerEvents="none">
        <ExternalLink
          size={12}
          strokeWidth={1.5}
          color={isDark ? colors.creamMuted : colors.oliveDark}
        />
      </View>
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
  externalIconWrapper: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    opacity: 0.7,
  },
});
