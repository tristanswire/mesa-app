import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme';
import { SectionLabel } from '../SectionLabel';
import { Text } from '../Text';

// Palette for image placeholders — cycles based on title char code sum
const PLACEHOLDER_PALETTE = [
  colors.terracotta,
  colors.olive,
  colors.oliveDark,
  colors.pine,
  colors.clay,
];

function RecipeImagePlaceholder({ title, aspectRatio }: { title: string; aspectRatio: number }) {
  const index = title.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % PLACEHOLDER_PALETTE.length;
  const base = PLACEHOLDER_PALETTE[index];

  return (
    <View style={[styles.placeholder, { aspectRatio }]}>
      {/* Simulated diagonal stripe pattern via rotated overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: base }]} />
      <View style={styles.stripeContainer} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stripe,
              { left: i * 24 - 48, backgroundColor: 'rgba(255,255,255,0.07)' },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export interface RecipeCardProps {
  title: string;
  duration: string;
  tag?: string;
  imageSource?: ImageSourcePropType;
  variant: 'hero' | 'grid';
  label?: string;
  onPress: () => void;
  ctaLabel?: string;
}

export function RecipeCard({
  title,
  duration,
  tag,
  imageSource,
  variant,
  label,
  onPress,
  ctaLabel,
}: RecipeCardProps) {
  const isHero = variant === 'hero';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${duration}${tag ? `, ${tag}` : ''}`}
      style={({ pressed }) => [
        styles.card,
        isHero ? styles.heroCard : styles.gridCard,
        pressed && styles.pressed,
      ]}
    >
      {/* Image / Placeholder */}
      {imageSource ? (
        <Image
          source={imageSource}
          style={[styles.image, isHero ? styles.heroImage : styles.gridImage]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, isHero ? styles.heroImage : styles.gridImage]}>
          <RecipeImagePlaceholder title={title} aspectRatio={isHero ? 16 / 9 : 1} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {isHero && label && (
          <View style={styles.labelRow}>
            <SectionLabel>{label}</SectionLabel>
          </View>
        )}

        <Text role="body" style={styles.title} numberOfLines={isHero ? 2 : 2}>
          {title}
        </Text>

        <View style={styles.metaRow}>
          <Text role="caption">{duration}</Text>
          {tag && (
            <>
              <Text role="caption" color="oliveDark"> · </Text>
              <Text role="caption">{tag}</Text>
            </>
          )}
        </View>

        {isHero && ctaLabel && (
          <Text role="body" color="terracotta" align="right" style={styles.cta}>
            {ctaLabel}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.oat,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroCard: {
    borderRadius: radii.lg,
    padding: spacing.base,
  },
  gridCard: {
    borderRadius: radii.md,
  },
  image: {
    overflow: 'hidden',
  },
  heroImage: {
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  gridImage: {
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
  },
  placeholder: {
    width: '100%',
    overflow: 'hidden',
  },
  stripeContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    transform: [{ rotate: '45deg' }, { scaleX: 2 }],
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: -200,
    bottom: -200,
    width: 12,
  },
  content: {
    padding: spacing.sm,
  },
  labelRow: {
    marginBottom: spacing.xs,
  },
  title: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cta: {
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.9,
  },
});
