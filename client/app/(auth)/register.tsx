import { AppLogo } from '@/components/brand';
import { FormSection, TextField } from '@/components/form';
import { Button, Text, useErrorMessage } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme';
import { registerSchema, type RegisterForm } from '@/validation/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toMessage = useErrorMessage();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(() => registerSchema(t), [t]);
  const { control, handleSubmit, formState } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const result = await signUp({ email: values.email, password: values.password });

      // With email confirmation on, Supabase issues no session — say so rather
      // than leaving the user on a form that appeared to do nothing.
      if (result.requiresEmailConfirmation) {
        Alert.alert(
          t('auth.confirmEmailTitle'),
          t('auth.confirmEmailMessage', { email: values.email }),
          [{ text: t('common.done'), onPress: () => router.replace('/(auth)/login') }],
        );
        return;
      }

      // The root guard moves us into the app; the home screen sends a user with
      // an empty garage on to onboarding. Navigating here as well would race it.
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/already registered|already exists/i.test(message)) {
        setSubmitError(t('auth.emailTaken'));
      } else if (/password/i.test(message) && /short|least|weak/i.test(message)) {
        setSubmitError(t('auth.weakPassword'));
      } else {
        setSubmitError(toMessage(error));
      }
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppLogo size="lg" style={styles.logo} />

        <View style={styles.heading}>
          <Text variant="title">{t('auth.registerTitle')}</Text>
          <Text variant="body" color={colors.textSecondary}>
            {t('auth.registerSubtitle')}
          </Text>
        </View>

        <FormSection>
          <TextField
            control={control}
            name="email"
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <TextField
            control={control}
            name="password"
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <TextField
            control={control}
            name="confirmPassword"
            label={t('auth.confirmPassword')}
            placeholder={t('auth.passwordPlaceholder')}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={() => void onSubmit()}
          />
        </FormSection>

        {submitError ? (
          <View style={styles.errorBox}>
            <Text variant="secondary" color={colors.primary}>
              {submitError}
            </Text>
          </View>
        ) : null}

        <Button
          label={formState.isSubmitting ? t('auth.registering') : t('auth.register')}
          onPress={() => void onSubmit()}
          loading={formState.isSubmitting}
        />

        <View style={styles.footer}>
          <Text variant="secondary" color={colors.textSecondary}>
            {t('auth.hasAccount')}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel={t('auth.signIn')}
            >
              <Text variant="bodyMedium" color={colors.primary}>
                {t('auth.signIn')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  logo: {
    marginBottom: spacing.xl,
  },
  heading: {
    gap: spacing.xs,
  },
  errorBox: {
    padding: spacing.lg,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
});
