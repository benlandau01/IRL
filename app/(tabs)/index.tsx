import * as Location from 'expo-location';
import { useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MOCK_USER_LOCATION, nearbyCheckIns } from '../../data/mockCheckIns';
import { fuzzCoordinate, insertCheckIn } from '../../lib/checkIns';
import { describeError } from '../../lib/errors';

export default function NearbyScreen() {
  const [checkingIn, setCheckingIn] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: MOCK_USER_LOCATION.lat,
          longitude: MOCK_USER_LOCATION.lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        {nearbyCheckIns.map((checkIn) => (
          <Marker
            key={checkIn.id}
            coordinate={{ latitude: checkIn.lat, longitude: checkIn.lng }}
            title={checkIn.userName}
            description={checkIn.note}
          />
        ))}
      </MapView>
      <FlatList
        style={styles.list}
        data={nearbyCheckIns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.userName}</Text>
            <Text style={styles.distance}>{item.distanceMeters}m away</Text>
          </View>
        )}
      />
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
});
