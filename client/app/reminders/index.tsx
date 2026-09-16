import { ScreenHeader } from '@/components/brand';
import { ReminderCard } from '@/components/reminder';
import { EmptyState, Screen, SectionHeader, SkeletonList } from '@/components/ui';
import { useReminders, useSelectedVehicle } from '@/hooks';
import { spacing } from '@/theme';
import type { Reminder } from '@/types';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Everything with a deadline, grouped by how close it is. Overdue first,
 * because that is the group the driver opened this screen to find.
 */
export default function RemindersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { vehicle, vehicles } = useSelectedVehicle();
  const { reminders, isLoading } = useReminders(vehicle);

  const groups = useMemo(
    () => [
      {
        key: 'overdue',
        title: t('reminders.overdue'),
        items: filter(reminders, 'OVERDUE'),
      },
      { key: 'dueSoon', title: t('reminders.dueSoon'), items: filter(reminders, 'DUE') },
      { key: 'later', title: t('reminders.later'), items: filter(reminders, 'UPCOMING') },
    ],
    [reminders, t],
  );

  const href = (reminder: Reminder): string =>
    reminder.source === 'MAINTENANCE'
      ? `/maintenance/${reminder.targetId}`
      : `/documents/${reminder.targetId}`;

  return (
    <>
      <ScreenHeader
        title={t('reminders.title')}
        subtitle={
          vehicle && vehicles.length > 1 ? `${vehicle.make} ${vehicle.model}` : undefined
        }
      />

      <Screen bottomInset={spacing.xxl}>
        <View style={styles.content}>
          {isLoading ? <SkeletonList count={3} /> : null}

          {!isLoading && reminders.length === 0 ? (
            <EmptyState
              icon="notifications-outline"
              title={t('reminders.empty')}
              body={t('reminders.emptyBody')}
              actionLabel={t('maintenance.add')}
              onAction={() => router.push('/maintenance/create')}
            />
          ) : null}

          {groups.map((group) =>
            group.items.length > 0 ? (
              <View key={group.key}>
                <SectionHeader title={group.title} />
                <View style={styles.list}>
                  {group.items.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onPress={() => router.push(href(reminder))}
                    />
                  ))}
                </View>
              </View>
            ) : null,
          )}
        </View>
      </Screen>
    </>
  );
}

function filter(reminders: Reminder[], severity: Reminder['severity']): Reminder[] {
  return reminders.filter((reminder) => reminder.severity === severity);
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  list: {
    gap: spacing.md,
  },
});
