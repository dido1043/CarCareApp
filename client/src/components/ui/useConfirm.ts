import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  /** Defaults to the localised "Delete". */
  confirmLabel?: string;
  destructive?: boolean;
}

/**
 * Destructive actions always ask first. The native alert is used rather than a
 * custom sheet because it is what users already recognise as a point of no
 * return, and it inherits the platform's own dark styling.
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const { t } = useTranslation();

  return useCallback(
    ({ title, message, confirmLabel, destructive = true }: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        if (Platform.OS !== 'web') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        Alert.alert(
          title,
          message,
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: confirmLabel ?? t('common.delete'),
              style: destructive ? 'destructive' : 'default',
              onPress: () => resolve(true),
            },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        );
      }),
    [t],
  );
}
