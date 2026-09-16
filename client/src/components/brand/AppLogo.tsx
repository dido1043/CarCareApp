import { colors, fontFamily } from '@/theme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/Text';

type LogoSize = 'sm' | 'md' | 'lg';

interface AppLogoProps {
  size?: LogoSize;
  /** Hides the wordmark, leaving just the angular mark. */
  markOnly?: boolean;
  showTagline?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<LogoSize, { mark: number; font: number; tracking: number }> = {
  sm: { mark: 20, font: 16, tracking: 1 },
  md: { mark: 28, font: 22, tracking: 1.5 },
  lg: { mark: 40, font: 32, tracking: 2 },
};

/**
 * The CarCare mark: three racing bands cut on the diagonal, then CAR in red and
 * CARE in white. The same geometry the launcher icon is generated from, so the
 * app icon and the in-app logo read as one identity.
 */
function Mark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Bands run bottom-left to top-right, clipped to a squared-off badge. */}
      <Path d="M14 72 L58 14 L74 14 L30 72 Z" fill={colors.primaryDark} />
      <Path d="M34 86 L86 18 L86 44 L54 86 Z" fill={colors.primary} />
      <Path d="M36 14 L52 14 L14 62 L14 44 Z" fill={colors.primary} />
      <Path d="M70 86 L86 64 L86 86 Z" fill={colors.text} />
    </Svg>
  );
}

export function AppLogo({
  size = 'md',
  markOnly = false,
  showTagline = false,
  style,
}: AppLogoProps) {
  const { t } = useTranslation();
  const dimensions = SIZES[size];

  if (markOnly) {
    return (
      <View style={style} accessibilityRole="image" accessibilityLabel={t('a11y.logo')}>
        <Mark size={dimensions.mark} />
      </View>
    );
  }

  return (
    <View style={style}>
      <View
        style={styles.row}
        accessibilityRole="image"
        accessibilityLabel={t('a11y.logo')}
      >
        <Mark size={dimensions.mark} />
        <Text
          style={[
            styles.wordmark,
            { fontSize: dimensions.font, letterSpacing: dimensions.tracking },
          ]}
        >
          <Text
            style={[
              styles.wordmark,
              { fontSize: dimensions.font, letterSpacing: dimensions.tracking },
            ]}
            color={colors.primary}
          >
            {t('brand.car')}
          </Text>
          {t('brand.care')}
        </Text>
      </View>

      {showTagline ? (
        <Text variant="secondary" color={colors.textSecondary} style={styles.tagline}>
          {t('brand.tagline')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: fontFamily.black,
    color: colors.text,
  },
  tagline: {
    marginTop: 6,
  },
});
