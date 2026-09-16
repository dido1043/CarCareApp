import { AppLogo } from '@/components/brand';
import { FormSection, TextField } from '@/components/form';
import { Button, Text, useErrorMessage } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme';
import { loginSchema, type LoginForm } from '@/validation/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
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

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn, sendPasswordReset } = useAuth();
  const insets = useSafeAreaInsets();
  const toMessage = useErrorMessage();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(() => loginSchema(t), [t]);
  const { control, handleSubmit, formState, getValues } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await signIn(values);
      // The root guard moves us to the tabs once the session lands.
    } catch (error) {
      // Supabase reports bad credentials as a 400; say so in the user's terms.
      const message = error instanceof Error ? error.message : '';
      setSubmitError(
        /invalid login credentials/i.test(message)
          ? t('auth.invalidCredentials')
          : toMessage(error),
      );
    }
  });

  const onForgotPassword = async (): Promise<void> => {
    const email = getValues('email').trim();
    if (!email) {
      setSubmitError(t('validation.email'));
      return;
    }

    try {
      await sendPasswordReset(email);
      Alert.alert(t('auth.resetSentTitle'), t('auth.resetSentMessage', { email }));
    } catch (error) {
      setSubmitError(toMessage(error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xxxl,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppLogo size="lg" showTagline style={styles.logo} />

        <View style={styles.heading}>
          <Text variant="title">{t('auth.loginTitle')}</Text>
          <Text variant="body" color={colors.textSecondary}>
            {t('auth.loginSubtitle')}
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
            returnKeyType="next"
          />

          <TextField
            control={control}
            name="password"
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            secure
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
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
          label={formState.isSubmitting ? t('auth.loggingIn') : t('auth.login')}
          onPress={() => void onSubmit()}
          loading={formState.isSubmitting}
        />

        <Pressable
          onPress={() => void onForgotPassword()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('auth.forgotPassword')}
          style={({ pressed }) => [styles.forgot, pressed && styles.pressed]}
        >
          <Text variant="secondary" color={colors.textSecondary}>
            {t('auth.forgotPassword')}
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Text variant="secondary" color={colors.textSecondary}>
            {t('auth.noAccount')}
          </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel={t('auth.createAccount')}
            >
              <Text variant="bodyMedium" color={colors.primary}>
                {t('auth.createAccount')}
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
    marginBottom: spacing.xxl,
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
  forgot: {
    alignSelf: 'center',
  },
  pressed: {
    opacity: 0.6,
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
