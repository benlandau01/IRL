import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  fetchNearbyCheckIns,
  fuzzCoordinate,
  insertCheckIn,
  updateCheckInNote,
  type CheckInRow,
} from '../../lib/checkIns';
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
  const [shareWithEveryone, setShareWithEveryone] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingCheckInId, setPendingCheckInId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
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
      const checkIn = await insertCheckIn(fuzzed, shareWithEveryone ? 'everyone' : 'friends');
      setStatus('Checked in!');
      setPendingCheckInId(checkIn.id);
      setNote('');
      load();
    } catch (err) {
      setStatus(describeError(err));
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleSaveNote() {
    if (!pendingCheckInId) return;
    setSavingNote(true);
    try {
      await updateCheckInNote(pendingCheckInId, note.trim());
      setPendingCheckInId(null);
    } catch (err) {
      setStatus(describeError(err));
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.visibilityRow}>
        <Text style={styles.visibilityLabel}>Share with everyone nearby</Text>
        <Switch value={shareWithEveryone} onValueChange={setShareWithEveryone} />
      </View>
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
      {pendingCheckInId && (
        <View style={styles.notePrompt}>
          <Text style={styles.noteLabel}>What happened?</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Grabbed coffee, said hi to a stranger…"
            value={note}
            onChangeText={setNote}
          />
          <View style={styles.noteButtons}>
            <TouchableOpacity onPress={() => setPendingCheckInId(null)} style={styles.noteSkip}>
              <Text style={styles.noteSkipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveNote}
              disabled={savingNote || !note.trim()}
              style={[styles.noteSave, (savingNote || !note.trim()) && styles.checkInButtonDisabled]}
            >
              {savingNote ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.noteSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  visibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
  },
  visibilityLabel: {
    fontSize: 14,
    color: '#444',
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
  notePrompt: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    gap: 8,
  },
  noteLabel: {
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  noteButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  noteSkip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  noteSkipText: {
    color: '#666',
  },
  noteSave: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  noteSaveText: {
    color: '#FFF',
    fontWeight: '600',
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
