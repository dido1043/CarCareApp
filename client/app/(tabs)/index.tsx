import {
  AttentionCard,
  DashboardGreeting,
  QuickActions,
  type QuickAction,
} from '@/components/dashboard';
import { ExpenseSummary } from '@/components/expense';
import { MaintenanceCard } from '@/components/maintenance';
import {
  Card,
  EmptyState,
  ErrorState,
  Screen,
  SectionHeader,
  SkeletonCard,
  Text,
} from '@/components/ui';
import { VehicleHeader, VehiclePicker } from '@/components/vehicle';
import { useDashboard, useReminders, useSelectedVehicle } from '@/hooks';
import { usePreferences } from '@/store/preferences';
import { colors, spacing } from '@/theme';
import type { DocumentType, MaintenanceType, Reminder } from '@/types';
import { DOCUMENT_ICONS, MAINTENANCE_ICONS } from '@/utils/icons';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The home screen. Answers, in order: which car, how far, what needs me, what's
 * next, what it costs, and what can I add right now.
 */
export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectVehicle = usePreferences((state) => state.selectVehicle);
  const { vehicle, vehicles, vehicleId, isLoading, isError, hasNoVehicles } =
    useSelectedVehicle();
  const dashboard = useDashboard(vehicleId);
  const { reminders } = useReminders(vehicle);

  const openReminders = reminders.filter((item) => item.severity !== 'UPCOMING');
  const attention = openReminders[0] ?? null;

  const quickActions: QuickAction[] = [
    {
      key: 'expense',
      label: t('dashboard.addExpense'),
      icon: 'add',
      primary: true,
      onPress: () => router.push('/expenses/create'),
    },
    {
      key: 'maintenance',
      label: t('dashboard.addMaintenance'),
      icon: 'construct-outline',
      onPress: () => router.push('/maintenance/create'),
    },
    {
      key: 'document',
      label: t('dashboard.addDocument'),
      icon: 'document-attach-outline',
      onPress: () => router.push('/documents/upload'),
    },
  ];

  if (isLoading) {
    return (
      <Screen scrollable={false}>
        <View style={[styles.loading, { paddingTop: insets.top + spacing.xl }]}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <View style={{ paddingTop: insets.top + spacing.xxxl }}>
          <ErrorState
            error={new Error('vehicles')}
            onRetry={() => void queryClient.invalidateQueries({ queryKey: ['vehicles'] })}
          />
        </View>
      </Screen>
    );
  }

  // An empty garage makes every other screen meaningless, so onboarding owns it.
  if (hasNoVehicles) {
    return <Redirect href="/onboarding/vehicle" />;
  }

  if (!vehicle) {
    return (
      <Screen>
        <View style={{ paddingTop: insets.top + spacing.xxxl }}>
          <EmptyState
            icon="car-sport-outline"
            title={t('vehicle.empty')}
            body={t('vehicle.emptyBody')}
            actionLabel={t('vehicle.add')}
            onAction={() => router.push('/vehicle/create')}
          />
        </View>
      </Screen>
    );
  }

  const totals = dashboard.data?.expenses;
  const upcoming = dashboard.data?.upcomingMaintenance ?? [];
  const nextService = upcoming[0];
  const currentMileageKm = Math.max(vehicle.odometerKm, vehicle.estimatedMileageKm);

  return (
    <Screen
      bottomInset={spacing.xxl}
      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['vehicles'] })}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg }}
    >
      <View style={styles.sections}>
        <DashboardGreeting
          reminderCount={openReminders.length}
          onOpenSettings={() => router.push('/settings')}
          onOpenReminders={() => router.push('/reminders')}
        />

        <VehicleHeader
          vehicle={vehicle}
          onSwitchVehicle={vehicles.length > 1 ? () => setPickerOpen(true) : undefined}
          onPressMileage={() => router.push(`/vehicle/${vehicle.id}/mileage`)}
        />

        <View style={styles.section}>
          <SectionHeader
            title={t('dashboard.attention')}
            accentColor={attention ? colors.primary : colors.border}
            actionLabel={openReminders.length > 1 ? t('common.viewAll') : undefined}
            onAction={() => router.push('/reminders')}
          />
          {attention ? (
            <AttentionCard
              kicker={reminderKicker(attention, t)}
              title={attention.title}
              detail={reminderDetail(attention, t)}
              icon={reminderIcon(attention)}
              tone={attention.severity === 'OVERDUE' ? 'danger' : 'warning'}
              onPress={() => router.push(reminderHref(attention))}
            />
          ) : (
            <Card>
              <Text variant="cardTitle">{t('dashboard.noAttention')}</Text>
              <Text
                variant="secondary"
                color={colors.textSecondary}
                style={styles.cardBody}
              >
                {t('dashboard.noAttentionBody')}
              </Text>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={t('dashboard.nextService')}
            actionLabel={t('common.viewAll')}
            onAction={() => router.push('/(tabs)/maintenance')}
          />
          {nextService ? (
            <MaintenanceCard
              record={nextService}
              mode="upcoming"
              currentMileageKm={currentMileageKm}
              onPress={() => router.push(`/maintenance/${nextService.id}`)}
            />
          ) : (
            <Card>
              <Text variant="cardTitle">{t('dashboard.noUpcomingService')}</Text>
              <Text
                variant="secondary"
                color={colors.textSecondary}
                style={styles.cardBody}
              >
                {t('dashboard.noUpcomingServiceBody')}
              </Text>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={t('expenses.title')}
            actionLabel={t('statistics.title')}
            onAction={() => router.push('/statistics')}
          />
          {totals ? (
            <ExpenseSummary totals={totals} currency={resolveCurrency(dashboard.data)} />
          ) : (
            <SkeletonCard lines={3} />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('dashboard.quickActions')} />
          <QuickActions actions={quickActions} />
        </View>
      </View>

      <VehiclePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        vehicles={vehicles}
        selectedVehicleId={vehicle.id}
        onSelect={selectVehicle}
        onAddVehicle={() => router.push('/vehicle/create')}
      />
    </Screen>
  );
}

/** The API sums whatever currency the expenses were recorded in. */
function resolveCurrency(
  dashboard: { recentExpenses: { currency: string }[] } | undefined,
) {
  return dashboard?.recentExpenses[0]?.currency ?? 'EUR';
}

type Translate = ReturnType<typeof useTranslation>['t'];

function reminderKicker(reminder: Reminder, t: Translate): string {
  return reminder.source === 'MAINTENANCE'
    ? t(`maintenanceType.${reminder.kind as MaintenanceType}`)
    : t(`documentType.${reminder.kind as DocumentType}`);
}

function reminderDetail(reminder: Reminder, t: Translate): string {
  if (reminder.daysRemaining !== null) {
    return reminder.daysRemaining < 0
      ? t('reminders.daysOverdue', { count: Math.abs(reminder.daysRemaining) })
      : t('reminders.daysRemaining', { count: reminder.daysRemaining });
  }
  if (reminder.kmRemaining !== null) {
    return t('maintenance.dueInKm', { distance: `${reminder.kmRemaining} km` });
  }
  return '';
}

function reminderIcon(reminder: Reminder) {
  return reminder.source === 'MAINTENANCE'
    ? MAINTENANCE_ICONS[reminder.kind as MaintenanceType]
    : DOCUMENT_ICONS[reminder.kind as DocumentType];
}

/** Reminders point back at whichever record produced them. */
function reminderHref(reminder: Reminder): string {
  return reminder.source === 'MAINTENANCE'
    ? `/maintenance/${reminder.targetId}`
    : `/documents/${reminder.targetId}`;
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xxl,
  },
  section: {
    gap: 0,
  },
  cardBody: {
    marginTop: spacing.xs,
  },
  loading: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
});
