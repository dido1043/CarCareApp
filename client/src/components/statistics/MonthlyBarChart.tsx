import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import { formatCurrencyCompact } from '@/utils/format';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

export interface MonthlyPoint {
  /** `YYYY-MM`, used as the key. */
  key: string;
  /** Short month label, already localised. */
  label: string;
  value: number;
}

interface MonthlyBarChartProps {
  data: MonthlyPoint[];
  currency: string;
}

const CHART_HEIGHT = 140;
/** Surface gap between adjacent bars, so fills never touch. */
const BAR_GAP = 6;
const BAR_RADIUS = 4;
/** A zero month still gets a sliver, so the month is visibly present at zero. */
const MIN_BAR_HEIGHT = 2;

/**
 * Monthly spend, one bar per month.
 *
 * A single series, so it carries a single hue: the bar's *length* encodes the
 * amount and colour encodes nothing. A red ramp was tested and rejected —
 * adjacent steps of one hue are indistinguishable under deuteranopia, and here
 * they would have been redundant with length anyway.
 *
 * Touch replaces hover: tapping a bar reveals its value, and every bar carries
 * an accessible label so the figures are reachable without the chart at all.
 */
export function MonthlyBarChart({ data, currency }: MonthlyBarChartProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [width, setWidth] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const handleLayout = (event: LayoutChangeEvent): void => {
    setWidth(event.nativeEvent.layout.width);
  };

  const maxValue = Math.max(...data.map((point) => point.value), 0);
  // Highest month is labelled by default; tapping moves the label.
  const peak = data.reduce<MonthlyPoint | null>(
    (best, point) => (best === null || point.value > best.value ? point : best),
    null,
  );
  const labelledKey = selectedKey ?? peak?.key ?? null;
  const labelled = data.find((point) => point.key === labelledKey);

  const slotWidth = data.length > 0 ? width / data.length : 0;
  const barWidth = Math.max(slotWidth - BAR_GAP, 2);
  // Crowded axes get every other label rather than overlapping text.
  const labelStride = data.length > 8 ? 2 : 1;

  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text variant="caption" color={colors.textSecondary}>
          {labelled ? labelled.label.toUpperCase() : ''}
        </Text>
        <Text variant="cardTitle" numeric color={colors.text}>
          {labelled ? formatCurrencyCompact(labelled.value, language, currency) : ''}
        </Text>
      </View>

      <View onLayout={handleLayout} style={styles.plot}>
        {width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            {data.map((point, index) => {
              const ratio = maxValue > 0 ? point.value / maxValue : 0;
              const height = Math.max(ratio * (CHART_HEIGHT - 8), MIN_BAR_HEIGHT);
              const x = index * slotWidth + BAR_GAP / 2;

              return (
                <Rect
                  key={point.key}
                  x={x}
                  y={CHART_HEIGHT - height}
                  width={barWidth}
                  height={height}
                  rx={BAR_RADIUS}
                  fill={colors.primary}
                  opacity={point.key === labelledKey ? 1 : 0.55}
                />
              );
            })}

            {/* Recessive baseline — the only axis the chart needs. */}
            <Line
              x1={0}
              y1={CHART_HEIGHT}
              x2={width}
              y2={CHART_HEIGHT}
              stroke={colors.border}
              strokeWidth={1}
            />
          </Svg>
        ) : null}

        {/* Touch targets span the full column height, not just the bar. */}
        <View style={styles.touchLayer} pointerEvents="box-none">
          {data.map((point) => (
            <Pressable
              key={point.key}
              onPress={() =>
                setSelectedKey((current) => (current === point.key ? null : point.key))
              }
              accessibilityRole="button"
              accessibilityLabel={t('a11y.chartBar', {
                month: point.label,
                amount: formatCurrencyCompact(point.value, language, currency),
              })}
              style={styles.touchTarget}
            />
          ))}
        </View>
      </View>

      <View style={styles.axis}>
        {data.map((point, index) => (
          <View key={point.key} style={styles.axisSlot}>
            {index % labelStride === 0 ? (
              <Text
                variant="caption"
                color={point.key === labelledKey ? colors.text : colors.textTertiary}
                numberOfLines={1}
              >
                {point.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 24,
  },
  plot: {
    height: CHART_HEIGHT,
    borderRadius: radius.sm,
  },
  touchLayer: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  touchTarget: {
    flex: 1,
  },
  axis: {
    flexDirection: 'row',
  },
  axisSlot: {
    flex: 1,
    alignItems: 'center',
  },
});
