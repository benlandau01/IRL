import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import CheckInCard from '../../components/CheckInCard';
import { fetchMyHistory, type CheckInRow } from '../../lib/checkIns';
import { describeError } from '../../lib/errors';

export default function HistoryScreen() {
  const [history, setHistory] = useState<CheckInRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setHistory(await fetchMyHistory());
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <ActivityIndicator style={styles.loading} />;
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      renderItem={({ item }) => (
        <CheckInCard
          checkIn={{
            userName: 'You',
            initials: 'ME',
            avatarColor: '#7CA6E8',
            timestamp: item.created_at,
            note: item.note,
          }}
        />
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>
          {error ?? 'No check-ins yet — head to Nearby to check in.'}
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: 24,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
  },
});
