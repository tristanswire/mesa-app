import React from 'react';
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
  imageSource?: ImageSourcePropType;
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
  imageSource,
  tintKey,
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
          <RecipeImagePlaceholder
            title={title}
            aspectRatio={isHero ? 16 / 9 : 1}
            tintKey={tintKey}
          />
        </View>
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
