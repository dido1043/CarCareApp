import { AppLogo, ScreenHeader } from '@/components/brand';
import {
  Button,
  Card,
  Divider,
  ListRow,
  Screen,
  SectionHeader,
  Sheet,
  Text,
  useConfirm,
} from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n';
import { env } from '@/lib/env';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'settings.languageEnglish',
  bg: 'settings.languageBulgarian',
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const confirm = useConfirm();
  const [languageOpen, setLanguageOpen] = useState(false);

  const onSignOut = async (): Promise<void> => {
    const confirmed = await confirm({
      title: t('auth.logoutConfirmTitle'),
      message: t('auth.logoutConfirmMessage'),
      confirmLabel: t('auth.logout'),
    });
    if (!confirmed) return;

    // The root guard sends us back to the login screen once the session clears.
    await signOut();
  };

  return (
    <>
      <ScreenHeader title={t('settings.title')} />

      <Screen bottomInset={spacing.xxl}>
        <View style={styles.content}>
          <View>
            <SectionHeader title={t('settings.account')} />
            <Card padded={false}>
              <ListRow
                label={t('settings.signedInAs')}
                value={user?.email ?? '—'}
                icon="person-outline"
              />
            </Card>
          </View>

          <View>
            <SectionHeader title={t('settings.preferences')} />
            <Card padded={false}>
              <ListRow
                label={t('settings.language')}
                value={t(LANGUAGE_LABELS[language])}
                icon="language-outline"
                onPress={() => setLanguageOpen(true)}
              />
            </Card>
          </View>

          <View>
            <SectionHeader title={t('settings.about')} />
            <Card padded={false}>
              <ListRow
                label={t('settings.version')}
                value={Constants.expoConfig?.version ?? '1.0.0'}
                icon="information-circle-outline"
              />
              <Divider />
              <ListRow
                label={t('settings.apiUrl')}
                value={env.apiBaseUrl.replace(/^https?:\/\//, '')}
                icon="cloud-outline"
              />
            </Card>
          </View>

          <Button
            label={t('auth.logout')}
            variant="danger"
            icon="log-out-outline"
            onPress={() => void onSignOut()}
          />

          <View style={styles.footer}>
            <AppLogo size="sm" showTagline />
          </View>
        </View>
      </Screen>

      <Sheet
        visible={languageOpen}
        onClose={() => setLanguageOpen(false)}
        title={t('settings.language')}
      >
        <View style={styles.options}>
          {SUPPORTED_LANGUAGES.map((option) => {
            const selected = option === language;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  void setLanguage(option);
                  setLanguageOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t(LANGUAGE_LABELS[option])}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  variant="bodyMedium"
                  color={selected ? colors.text : colors.textSecondary}
                >
                  {t(LANGUAGE_LABELS[option])}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  options: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.7,
  },
});
