import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

interface AttentionCardProps {
  /** Small all-caps label above the title, e.g. the document type. */
  kicker: string;
  title: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'danger' | 'warning' | 'neutral';
  onPress: () => void;
}

const TONE_COLORS: Record<AttentionCardProps['tone'], string> = {
  danger: colors.danger,
  warning: colors.warning,
  neutral: colors.textSecondary,
};

/**
 * The dashboard's answer to "what needs me right now". One item only — a list of
 * six urgent things is a list of none.
 */
export function AttentionCard({
  kicker,
  title,
  detail,
  icon,
  tone,
  onPress,
}: AttentionCardProps) {
  const { t } = useTranslation();
  const tint = TONE_COLORS[tone];

  return (
    <Card onPress={onPress} accentColor={tint} accessibilityLabel={`${title}. ${detail}`}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { borderColor: tint }]}>
          <Ionicons name={icon} size={20} color={tint} />
        </View>

        <View style={styles.body}>
          <Text variant="overline" color={tint}>
            {kicker}
          </Text>
          <Text variant="cardTitle" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="secondary" color={colors.textSecondary} numberOfLines={2}>
            {detail}
          </Text>
        </View>

        {/*
         * An affordance, not a control: the whole card already handles the tap.
         * A nested Pressable would be invalid DOM on web and would make screen
         * readers announce two buttons that do the same thing.
         */}
        <View style={styles.action} importantForAccessibility="no-hide-descendants">
          <Text variant="caption" color={colors.text}>
            {t('common.view').toUpperCase()}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElevated,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  action: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.cardElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
