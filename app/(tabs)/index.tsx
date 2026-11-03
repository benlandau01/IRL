import MapView, { Marker } from 'react-native-maps';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MOCK_USER_LOCATION, nearbyCheckIns } from '../../data/mockCheckIns';

export default function NearbyScreen() {
  return (
    <View style={styles.container}>
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
