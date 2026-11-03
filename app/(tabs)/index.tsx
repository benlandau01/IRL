import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchNearbyCheckIns, fuzzCoordinate, insertCheckIn, type CheckInRow } from '../../lib/checkIns';
import { describeError } from '../../lib/errors';
import { haversineMeters } from '../../lib/geo';

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
  const [checkingIn, setCheckingIn] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearby, setNearby] = useState<NearbyItem[]>([]);

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

      const rows = await fetchNearbyCheckIns();
      const withDistance = rows
        .map((row) => ({ ...row, distanceMeters: haversineMeters(lat, lng, row.lat, row.lng) }))
        .filter((row) => row.distanceMeters <= NEARBY_RADIUS_METERS)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
      setNearby(withDistance);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCheckIn() {
    setStatus(null);
    setCheckingIn(true);
    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus('Location permission denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const fuzzed = fuzzCoordinate(position.coords.latitude, position.coords.longitude);
      await insertCheckIn(fuzzed);
      setStatus('Checked in!');
      load();
    } catch (err) {
      setStatus(describeError(err));
    } finally {
      setCheckingIn(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.checkInButton, checkingIn && styles.checkInButtonDisabled]}
        onPress={handleCheckIn}
        disabled={checkingIn}
      >
        {checkingIn ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.checkInButtonText}>Check in</Text>
        )}
      </TouchableOpacity>
      {status && <Text style={styles.status}>{status}</Text>}
      {loading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <>
          <MapView
            style={styles.map}
            showsUserLocation
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
          <FlatList
            style={styles.list}
            data={nearby}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.name}>Someone</Text>
                <Text style={styles.distance}>
                  {Math.round(item.distanceMeters)}m away • {timeAgo(item.created_at)}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>{error ?? 'No one checked in nearby right now.'}</Text>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  checkInButton: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkInButtonDisabled: {
    opacity: 0.6,
  },
  checkInButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  status: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  loading: {
    marginTop: 24,
  },
  map: {
    flex: 1,
  },
  list: {
    maxHeight: 180,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  name: {
    fontWeight: '600',
  },
  distance: {
    color: '#888',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 16,
  },
});
