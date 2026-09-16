import { colors, radius, spacing } from '@/theme';
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** One shared pulse so a screenful of placeholders breathes together. */
function usePulse(): SharedValue<number> {
  const progress = useSharedValue(0.4);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [progress]);

  return progress;
}

export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const progress = usePulse();
  const animatedStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      accessible={false}
      style={[styles.block, { width, height }, animatedStyle, style]}
    />
  );
}

/** Card-shaped placeholder used while a list loads. */
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <View style={styles.card}>
      <Skeleton width="45%" height={12} />
      <Skeleton width="70%" height={20} style={{ marginTop: spacing.md }} />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '35%' : '90%'}
          height={12}
          style={{ marginTop: spacing.sm }}
        />
      ))}
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.skeleton,
    borderRadius: radius.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
});
