import { AppLogo } from '@/components/brand';
import { Button, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BENEFITS = [
  { key: 'benefitService', icon: 'construct-outline' },
  { key: 'benefitCosts', icon: 'trending-up-outline' },
  { key: 'benefitDocuments', icon: 'shield-checkmark-outline' },
] as const;

/**
 * Shown once, after registration. It exists because an empty garage makes every
 * other screen meaningless — there is one thing to do, so the screen does one
 * thing.
 */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xxxl,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppLogo size="lg" />

        <View style={styles.heading}>
          <Text variant="display">{t('onboarding.title')}</Text>
          <Text variant="body" color={colors.textSecondary}>
            {t('onboarding.subtitle')}
          </Text>
        </View>

        <Text variant="body" color={colors.textSecondary}>
          {t('onboarding.body')}
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.key} style={styles.benefit}>
              <View style={styles.benefitIcon}>
                <Ionicons name={benefit.icon} size={17} color={colors.primary} />
              </View>
              <Text variant="bodyMedium" style={styles.benefitLabel}>
                {t(`onboarding.${benefit.key}`)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          label={t('onboarding.addVehicle')}
          icon="add"
          onPress={() => router.replace('/vehicle/create')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  heading: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  benefits: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  benefitIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  benefitLabel: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
