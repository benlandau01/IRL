import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../lib/auth-context';
import { endCheckIn, fetchMyActiveCheckIn, fetchNearbyCheckIns, type CheckInRow } from '../../lib/checkIns';
import { useCheckIn } from '../../lib/checkin-context';
import { describeError } from '../../lib/errors';
import { haversineMeters } from '../../lib/geo';
import { useTheme } from '../../lib/theme';

const NEARBY_RADIUS_METERS = 5000;

type NearbyItem = CheckInRow & { distanceMeters: number };

function timeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

export default function NearbyScreen() {
  const theme = useTheme();
  const { colors, type, space, radius, shadows, mode } = theme;
  const insets = useSafeAreaInsets();
  const { signOut } = useSession();
  const router = useRouter();
  const { refreshSignal } = useCheckIn();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearby, setNearby] = useState<NearbyItem[]>([]);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckInRow | null>(null);
  const [endingCheckIn, setEndingCheckIn] = useState(false);
  const [wavedIds, setWavedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setError(null);
    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setError('Location permission denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setUserLocation({ lat, lng });

      const [rows, mine] = await Promise.all([fetchNearbyCheckIns(), fetchMyActiveCheckIn()]);
      const withDistance = rows
        .map((row) => ({ ...row, distanceMeters: haversineMeters(lat, lng, row.lat, row.lng) }))
        .filter((row) => row.distanceMeters <= NEARBY_RADIUS_METERS)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
      setNearby(withDistance);
      setActiveCheckIn(mine);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshSignal]);

  async function handleEndCheckIn() {
    if (!activeCheckIn) return;
    setEndingCheckIn(true);
    try {
      await endCheckIn(activeCheckIn.id);
      setActiveCheckIn(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setEndingCheckIn(false);
    }
  }

  function handleWave(id: string) {
    // UI-only for now — no notification/persistence yet (CLAUDE.md still
    // lists a lightweight "wave" as an open product question).
    setWavedIds((prev) => new Set(prev).add(id));
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <Text style={[type.body, { color: colors.text2 }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        showsUserLocation
        userInterfaceStyle={mode}
        initialRegion={{
          latitude: userLocation?.lat ?? 37.7955,
          longitude: userLocation?.lng ?? -122.3937,
          latitudeDelta: 0.07,
          longitudeDelta: 0.07,
        }}
      >
        {nearby.map((item) => (
          <Marker
            key={item.id}
            coordinate={{ latitude: item.lat, longitude: item.lng }}
            title="Someone nearby"
            description={`${Math.round(item.distanceMeters)}m away`}
          />
        ))}
      </MapView>

      <View style={[styles.topOverlay, { top: insets.top + space.sm, left: space.lg, right: space.lg }]}>
        <View style={styles.topLinks}>
          {/* Temporary, for testing dark mode before there's a real settings screen. */}
          <TouchableOpacity
            onPress={() => theme.setPreference(mode === 'dark' ? 'light' : 'dark')}
            style={styles.signOut}
          >
            <Text style={[type.label, { color: colors.accentText }]}>
              {mode === 'dark' ? 'Light mode' : 'Dark mode'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOut}>
            <Text style={[type.label, { color: colors.danger }]}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {activeCheckIn && (
          <View style={[styles.liveCard, { backgroundColor: colors.glass, borderRadius: radius.card }, shadows.card]}>
            <View style={styles.liveRow}>
              <View style={[styles.liveDot, { backgroundColor: colors.live, shadowColor: colors.liveGlow }]} />
              <Text style={[type.headline, { color: colors.text }]}>You're checked in</Text>
            </View>
            <Text style={[type.label, { color: colors.text2 }]}>
              {timeAgo(activeCheckIn.created_at)} · {activeCheckIn.visibility === 'everyone' ? 'Everyone nearby' : 'Friends only'}
            </Text>
            <TouchableOpacity
              onPress={handleEndCheckIn}
              disabled={endingCheckIn}
              style={[styles.endButton, { backgroundColor: colors.raised, borderRadius: radius.button }]}
            >
              <Text style={[type.button, { color: colors.text }]}>{endingCheckIn ? 'Ending…' : 'End'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
          shadows.card,
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.lineStrong }]} />
        <View style={styles.sheetHeaderRow}>
          <Text style={[type.title, { color: colors.text }]}>Nearby now</Text>
          <View style={[styles.chip, { backgroundColor: colors.accentSoft }]}>
            <Text style={[type.label, { color: colors.accentText }]}>{nearby.length} within 5 km</Text>
          </View>
        </View>
        <FlatList
          data={nearby}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <View style={[styles.rowAvatar, { backgroundColor: colors.raised }]} />
              <View style={styles.rowBody}>
                <Text style={[type.headline, { color: colors.text }]}>Someone</Text>
                <Text style={[type.caption, { color: colors.text2 }]}>
                  {Math.round(item.distanceMeters)}m away · {timeAgo(item.created_at)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleWave(item.id)}
                disabled={wavedIds.has(item.id)}
                style={[
                  styles.waveButton,
                  { borderRadius: radius.pill },
                  index === 0
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.raised },
                ]}
              >
                <Text style={[type.label, { color: index === 0 ? colors.onAccent : colors.text }]}>
                  {wavedIds.has(item.id) ? 'Waved' : 'Wave'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[type.caption, { color: colors.text2, textAlign: 'center', marginTop: space.md }]}>
              {error ?? 'No one checked in nearby right now.'}
            </Text>
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topOverlay: {
    position: 'absolute',
    gap: 10,
  },
  topLinks: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 16,
  },
  signOut: {
    minHeight: 32,
    justifyContent: 'center',
  },
  liveCard: {
    padding: 14,
    gap: 6,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  endButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginTop: 4,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: 340,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    marginBottom: 10,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
  },
  rowAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  rowBody: {
    flex: 1,
  },
  waveButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
