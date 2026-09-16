import { DocumentStatus, MaintenanceStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Badge, type BadgeTone } from './Badge';

type IconName = keyof typeof Ionicons.glyphMap;

const MAINTENANCE_TONES: Record<MaintenanceStatus, { tone: BadgeTone; icon: IconName }> =
  {
    OVERDUE: { tone: 'danger', icon: 'alert-circle' },
    DUE: { tone: 'warning', icon: 'time' },
    UPCOMING: { tone: 'neutral', icon: 'calendar-outline' },
  };

const DOCUMENT_TONES: Record<DocumentStatus, { tone: BadgeTone; icon: IconName }> = {
  EXPIRED: { tone: 'danger', icon: 'alert-circle' },
  EXPIRING_SOON: { tone: 'warning', icon: 'time' },
  VALID: { tone: 'success', icon: 'checkmark-circle' },
  NO_EXPIRY: { tone: 'neutral', icon: 'infinite' },
};

/**
 * One badge for both status vocabularies. Each pairs a colour with an icon and a
 * word, so the meaning survives for anyone who cannot separate red from orange.
 */
export function MaintenanceStatusBadge({
  status,
  size = 'md',
}: {
  status: MaintenanceStatus;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation();
  const { tone, icon } = MAINTENANCE_TONES[status];
  return (
    <Badge label={t(`maintenanceStatus.${status}`)} tone={tone} icon={icon} size={size} />
  );
}

export function DocumentStatusBadge({
  status,
  size = 'md',
}: {
  status: DocumentStatus;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation();
  const { tone, icon } = DOCUMENT_TONES[status];
  return (
    <Badge label={t(`documentStatus.${status}`)} tone={tone} icon={icon} size={size} />
  );
}
