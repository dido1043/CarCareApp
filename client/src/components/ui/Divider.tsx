import { colors, spacing } from '@/theme';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export function Divider({
  inset = false,
  style,
}: {
  inset?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.line, inset && styles.inset, style]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  inset: {
    marginLeft: spacing.xxl + spacing.lg,
  },
});
