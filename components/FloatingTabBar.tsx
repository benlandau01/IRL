import { BlurView } from 'expo-blur';
import { Clock, LocateFixed, MapPin, Users } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useCheckIn } from '../lib/checkin-context';
import { useTheme } from '../lib/theme';

const ICONS: Record<string, typeof MapPin> = {
  index: MapPin,
  friends: Users,
  history: Clock,
};

export default function FloatingTabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const { colors, type, radius, space, shadows, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { openCheckIn } = useCheckIn();

  return (
    <View style={[styles.container, { left: space.lg, right: space.lg, bottom: insets.bottom + space.xl }]}>
      <View style={[styles.pill, { borderRadius: radius.pill }, shadows.card]}>
        <BlurView
          intensity={40}
          tint={mode}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]}
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = ICONS[route.name] ?? MapPin;
          const title = descriptors[route.key]?.options?.title ?? route.name;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigateToTab(route.key)}
              style={styles.tab}
              accessibilityLabel={title}
            >
              <View
                style={[
                  styles.tabInner,
                  { borderRadius: radius.pill },
                  focused && { backgroundColor: colors.accentSoft },
                ]}
              >
                <Icon size={22} strokeWidth={1.9} color={focused ? colors.accentText : colors.text2} />
                <Text style={[type.tab, { color: focused ? colors.accentText : colors.text2 }]}>{title}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={openCheckIn}
        accessibilityLabel="Check in"
        style={[
          styles.checkInButton,
          { backgroundColor: colors.accent, marginLeft: space.md },
          shadows.accentButton(colors.accentGlow),
        ]}
      >
        <LocateFixed size={28} strokeWidth={1.9} color={colors.onAccent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flex: 1,
    height: 68,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    width: '86%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  checkInButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
