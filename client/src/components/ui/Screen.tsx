import { colors, screenPadding, spacing } from '@/theme';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  /** Wraps the content in a ScrollView. Turn off for screens with their own list. */
  scrollable?: boolean;
  onRefresh?: () => Promise<unknown> | void;
  refreshing?: boolean;
  padded?: boolean;
  /** Extra bottom room so content clears a floating action or the tab bar. */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Page frame: black ground, safe-area aware, optionally pull-to-refresh.
 *
 * Bottom inset is added rather than applied as padding to the container, so a
 * scroll view still scrolls behind the home indicator instead of stopping short.
 */
export function Screen({
  children,
  scrollable = true,
  onRefresh,
  refreshing,
  padded = true,
  bottomInset = 0,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  // A refresh can outlive the screen; the ref keeps the finally block honest
  // without scheduling state on an unmounted component.
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleRefresh = async (): Promise<void> => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      if (isMounted.current) setIsRefreshing(false);
    }
  };

  const contentStyle = [
    padded && styles.padded,
    { paddingBottom: insets.bottom + bottomInset + spacing.xl },
    contentContainerStyle,
  ];

  if (!scrollable) {
    return <View style={[styles.screen, style]}>{children}</View>;
  }

  return (
    <ScrollView
      style={[styles.screen, style]}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing ?? isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: screenPadding,
  },
});
