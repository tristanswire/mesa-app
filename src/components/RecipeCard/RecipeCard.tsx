import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme';
import { RecipeImagePlaceholder } from '../RecipeImagePlaceholder';
import { SectionLabel } from '../SectionLabel';
import { Text } from '../Text';

export interface RecipeCardProps {
  title: string;
  duration: string;
  tag?: string;
  // User-assigned meal category. When present it replaces `tag` in the meta
  // row — categories are intentional, tags are heuristic.
  category?: string;
  imageSource?: ImageSourcePropType;
  imageUrl?: string | null;
  tintKey?: 'terracotta' | 'olive';
  variant: 'hero' | 'grid';
  label?: string;
  onPress: () => void;
  ctaLabel?: string;
}

export function RecipeCard({
  title,
  duration,
  tag,
  category,
  imageSource,
  imageUrl,
  variant,
  label,
  onPress,
  ctaLabel,
}: RecipeCardProps) {
  const isHero = variant === 'hero';
  const resolvedImageSource = imageSource ?? (imageUrl ? { uri: imageUrl } : undefined);
  const badge = category ?? tag;
  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !resolvedImageSource || imageFailed;
  const aspectRatio = isHero ? 16 / 9 : 1;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${duration}${badge ? `, ${badge}` : ''}`}
      style={({ pressed }) => [
        styles.card,
        isHero ? styles.heroCard : styles.gridCard,
        pressed && styles.pressed,
      ]}
    >
      {/* Image / Placeholder. onError flips to the styled placeholder when a
          URL fails to load (broken link, 404, network) so the card never
          shows the system's blank/grey image state. */}
      {showPlaceholder ? (
        <View style={[styles.image, isHero ? styles.heroImage : styles.gridImage]}>
          <RecipeImagePlaceholder aspectRatio={aspectRatio} />
        </View>
      ) : (
        <Image
          source={resolvedImageSource!}
          onError={() => setImageFailed(true)}
          style={[
            styles.image,
            isHero ? styles.heroImage : styles.gridImage,
            { aspectRatio },
          ]}
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {isHero && label && (
          <View style={styles.labelRow}>
            <SectionLabel>{label}</SectionLabel>
          </View>
        )}

        <Text role="body" style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.metaRow}>
          <Text role="caption">{duration}</Text>
          {badge && (
            <>
              <Text role="caption" color="oliveDark"> · </Text>
              <Text role="caption">{badge}</Text>
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
