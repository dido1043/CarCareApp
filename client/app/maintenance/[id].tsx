import { HeaderIconButton, ScreenHeader } from '@/components/brand';
import { MaintenanceForm, useMaintenanceDueLabel } from '@/components/maintenance';
import {
  Button,
  Card,
  Divider,
  ErrorState,
  ListRow,
  MaintenanceStatusBadge,
  Screen,
  SectionHeader,
  SkeletonCard,
  Text,
  useConfirm,
} from '@/components/ui';
import {
  useDeleteMaintenance,
  useMaintenanceRecord,
  useSelectedVehicle,
  useUpdateMaintenance,
} from '@/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing } from '@/theme';
import { formatCurrency, formatDate, formatMileage } from '@/utils/format';
import { MAINTENANCE_ICONS } from '@/utils/icons';
import { toMaintenanceUpdatePayload } from '@/utils/payload';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export default function MaintenanceDetailScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const confirm = useConfirm();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [editing, setEditing] = useState(false);

  const { vehicle, vehicleId } = useSelectedVehicle();
  const {
    data: record,
    isLoading,
    isError,
    error,
    refetch,
  } = useMaintenanceRecord(vehicleId, id);
  const updateMaintenance = useUpdateMaintenance(vehicleId ?? '', id);
  const deleteMaintenance = useDeleteMaintenance(vehicleId ?? '');
  const dueLabel = useMaintenanceDueLabel();

  const currentMileageKm = vehicle
    ? Math.max(vehicle.odometerKm, vehicle.estimatedMileageKm)
    : 0;

  const onDelete = async (): Promise<void> => {
    if (!record) return;
    const confirmed = await confirm({
      title: t('maintenance.deleteTitle'),
      message: t('maintenance.deleteMessage', { title: record.title }),
    });
    if (!confirmed) return;

    await deleteMaintenance.mutateAsync(record.id);
    router.back();
  };

  if (editing && record) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('maintenance.editTitle')}
          onBack={() => setEditing(false)}
        />
        <MaintenanceForm
          record={record}
          submitLabel={t('common.save')}
          onSubmit={async (values) => {
            await updateMaintenance.mutateAsync(toMaintenanceUpdatePayload(values));
            setEditing(false);
          }}
          secondaryAction={
            <Button
              label={t('common.delete')}
              variant="danger"
              icon="trash-outline"
              onPress={() => void onDelete()}
            />
          }
        />
      </View>
    );
  }

  const due = record ? dueLabel(record, currentMileageKm) : null;

  const details = record
    ? [
        { label: t('maintenance.type'), value: t(`maintenanceType.${record.type}`) },
        { label: t('maintenance.date'), value: formatDate(record.date, language) },
        {
          label: t('maintenance.cost'),
          value:
            record.cost !== null
              ? formatCurrency(record.cost, language)
              : t('common.notSet'),
        },
        {
          label: t('maintenance.mileage'),
          value:
            record.mileageKm !== null
              ? formatMileage(record.mileageKm, language)
              : t('common.notSet'),
        },
      ]
    : [];

  const schedule = record
    ? [
        {
          label: t('maintenance.nextDueDate'),
          value: record.nextDueDate
            ? formatDate(record.nextDueDate, language)
            : t('common.notSet'),
        },
        {
          label: t('maintenance.nextDueMileage'),
          value:
            record.nextDueMileageKm !== null
              ? formatMileage(record.nextDueMileageKm, language)
              : t('common.notSet'),
        },
      ]
    : [];

  return (
    <>
      <ScreenHeader
        title={record?.title ?? t('maintenance.detailTitle')}
        actions={
          record ? (
            <>
              <HeaderIconButton
                icon="create-outline"
                label={t('common.edit')}
                onPress={() => setEditing(true)}
              />
              <HeaderIconButton
                icon="trash-outline"
                label={t('common.delete')}
                tone="danger"
                onPress={() => void onDelete()}
              />
            </>
          ) : null
        }
      />

      <Screen onRefresh={refetch} bottomInset={spacing.xxl}>
        <View style={styles.content}>
          {isLoading ? <SkeletonCard lines={4} /> : null}
          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {record ? (
            <>
              <Card>
                <View style={styles.hero}>
                  <View style={styles.heroIcon}>
                    <Ionicons
                      name={MAINTENANCE_ICONS[record.type]}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.heroBody}>
                    <Text variant="heading">{record.title}</Text>
                    <Text variant="secondary" color={colors.textSecondary}>
                      {t(`maintenanceType.${record.type}`)}
                    </Text>
                  </View>
                </View>

                {record.status && due ? (
                  <View style={styles.statusRow}>
                    <MaintenanceStatusBadge status={record.status} />
                    <Text variant="secondary" color={colors.textSecondary}>
                      {due}
                    </Text>
                  </View>
                ) : null}
              </Card>

              <View>
                <SectionHeader title={t('vehicle.details')} />
                <Card padded={false}>
                  {details.map((detail, index) => (
                    <Fragment key={detail.label}>
                      {index > 0 ? <Divider /> : null}
                      <ListRow label={detail.label} value={detail.value} />
                    </Fragment>
                  ))}
                </Card>
              </View>

              <View>
                <SectionHeader title={t('maintenance.scheduleSection')} />
                <Card padded={false}>
                  {schedule.map((detail, index) => (
                    <Fragment key={detail.label}>
                      {index > 0 ? <Divider /> : null}
                      <ListRow label={detail.label} value={detail.value} />
                    </Fragment>
                  ))}
                </Card>
              </View>

              {record.description ? (
                <View>
                  <SectionHeader title={t('maintenance.description')} />
                  <Card>
                    <Text variant="body" color={colors.textSecondary}>
                      {record.description}
                    </Text>
                  </Card>
                </View>
              ) : null}

              {record.notes ? (
                <View>
                  <SectionHeader title={t('maintenance.notes')} />
                  <Card>
                    <Text variant="body" color={colors.textSecondary}>
                      {record.notes}
                    </Text>
                  </Card>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
  heroBody: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexWrap: 'wrap',
  },
});
