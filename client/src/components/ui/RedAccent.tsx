import { colors, radius } from '@/theme';
import { View, type ViewStyle } from 'react-native';

interface RedAccentProps {
  /** Vertical for a bar down the side of a card, horizontal for under a title. */
  orientation?: 'vertical' | 'horizontal';
  length?: number;
  thickness?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * The small angular red rule that marks CarCare's sections and cards. Kept as a
 * component so the brand's one decorative element stays identical everywhere.
 */
export function RedAccent({
  orientation = 'horizontal',
  length = 28,
  thickness = 3,
  color = colors.primary,
  style,
}: RedAccentProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: isHorizontal ? length : thickness,
          height: isHorizontal ? thickness : length,
          backgroundColor: color,
          borderRadius: radius.sm,
        },
        style,
      ]}
    />
  );
}
