import {
  BookOpen,
  ChefHat,
  Cookie,
  ExternalLink,
  Package,
  Scale,
  ShoppingBag,
  Thermometer,
  Utensils,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { buildAffiliateUrl, buildPartnerSearchUrl } from '../../data/affiliate';
import { recordClick, type ClickSource } from '../../data/clicks';
import { colors, radii, shadows, spacing } from '../../theme';
import { Text } from '../Text';

export interface AffiliateCardProps {
  productName: string;
  price: string;
  partner: string;
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

// Tool product-name → Lucide icon. Order matters: narrower categories first so
// e.g. "instant pot" doesn't fall into ChefHat's "pot" rule and "loaf pan"
// doesn't fall into ChefHat's "pan". Word boundaries (\b) guard against
// substring hits like "panini" matching "pan" or "baguette" matching "bag".
function getToolIcon(productName: string): LucideIcon {
  const name = productName.toLowerCase();

  if (/instant pot|air fryer|blender|mixer|food processor|processor|appliance|machine/.test(name)) return Zap;
  if (/cookbook|\bbook\b/.test(name)) return BookOpen;
  if (/thermometer/.test(name)) return Thermometer;
  if (/\bscale\b|measuring cup|measuring spoon/.test(name)) return Scale;
  if (/baking sheet|cake pan|muffin|loaf|pie dish|rolling pin|\bbaking\b/.test(name)) return Cookie;
  if (/knife|blade|sharpener|cutting board/.test(name)) return UtensilsCrossed;
  if (/container|\bjar\b|storage|\bbag(s)?\b|\bwrap(s|per|ping)?\b/.test(name)) return Package;
  if (/skillet|\bwok\b|saucepan|dutch oven|\bpan(s)?\b|\bpot(s)?\b/.test(name)) return ChefHat;
  if (/spatula|spoon|tongs|whisk|ladle|peeler|grater|zester|utensil/.test(name)) return Utensils;

  return ShoppingBag;
}

export function AffiliateCard({
  productName,
  price,
  partner,
  theme = 'light',
  toolId,
  recipeId,
  affiliateUrl,
  source,
  onPress,
}: AffiliateCardProps) {
  const isDark = theme === 'dark';
  const Icon = getToolIcon(productName);

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
      {/* Category icon — replaces the prior image placeholder. Real product
          photos are unreliable (white backgrounds, inconsistent sizing); a
          Lucide icon keyed off the product name stays consistent across all
          cards. */}
      <View style={styles.thumbnail}>
        <Icon size={28} strokeWidth={1.5} color={colors.oliveDark} />
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
    backgroundColor: colors.oat,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
