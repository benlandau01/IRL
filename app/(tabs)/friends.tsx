import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CheckInCard from '../../components/CheckInCard';
import { colorForUserId, initialsFor } from '../../lib/avatar';
import { useSession } from '../../lib/auth-context';
import { describeError } from '../../lib/errors';
import {
  acceptFriendRequest,
  fetchFriendsFeed,
  fetchPendingRequests,
  sendFriendRequest,
  type FriendRequestRow,
} from '../../lib/friends';
import type { CheckInRow } from '../../lib/checkIns';
import type { Profile } from '../../lib/profiles';

type FeedItem = CheckInRow & { profile: Profile };
type PendingRequest = FriendRequestRow & { requester: Profile };

export default function FriendsScreen() {
  const { profile } = useSession();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [feedRows, pendingRows] = await Promise.all([fetchFriendsFeed(), fetchPendingRequests()]);
      setFeed(feedRows);
      setPending(pendingRows);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSendRequest() {
    setSendStatus(null);
    setSending(true);
    try {
      await sendFriendRequest(codeInput);
      setSendStatus('Request sent!');
      setCodeInput('');
    } catch (err) {
      setSendStatus(describeError(err));
    } finally {
      setSending(false);
    }
  }

  async function handleAccept(id: string) {
    try {
      await acceptFriendRequest(id);
      load();
    } catch (err) {
      setSendStatus(describeError(err));
    }
  }

  function handleShareCode() {
    if (!profile) return;
    Share.share({ message: `Add me on IRL — my friend code is ${profile.friend_code}` });
  }

  const header = (
    <View style={styles.header}>
      {profile && (
        <TouchableOpacity style={styles.codeBox} onPress={handleShareCode}>
          <Text style={styles.codeLabel}>Your friend code</Text>
          <Text style={styles.codeValue}>{profile.friend_code}</Text>
          <Text style={styles.codeHint}>Tap to share</Text>
        </TouchableOpacity>
      )}

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Enter a friend's code"
          autoCapitalize="characters"
          value={codeInput}
          onChangeText={setCodeInput}
        />
        <TouchableOpacity
          style={[styles.addButton, (!codeInput.trim() || sending) && styles.addButtonDisabled]}
          onPress={handleSendRequest}
          disabled={!codeInput.trim() || sending}
        >
          {sending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.addButtonText}>Add</Text>}
        </TouchableOpacity>
      </View>
      {sendStatus && <Text style={styles.sendStatus}>{sendStatus}</Text>}

      {pending.length > 0 && (
        <View style={styles.pendingSection}>
          <Text style={styles.pendingTitle}>Friend requests</Text>
          {pending.map((request) => (
            <View key={request.id} style={styles.pendingRow}>
              <Text style={styles.pendingName}>{request.requester.display_name}</Text>
              <TouchableOpacity onPress={() => handleAccept(request.id)} style={styles.acceptButton}>
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.feedTitle}>Feed</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={styles.loading} />;
  }

  return (
    <FlatList
      data={feed}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <CheckInCard
          checkIn={{
            userName: item.profile.display_name,
            initials: initialsFor(item.profile.display_name),
            avatarColor: colorForUserId(item.profile.id),
            timestamp: item.created_at,
            note: item.note,
          }}
        />
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>
          {error ?? 'No friend check-ins yet — add a friend above to get started.'}
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: 24,
  },
  header: {
    padding: 16,
    gap: 12,
  },
  codeBox: {
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 13,
    color: '#666',
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },
  codeHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  sendStatus: {
    color: '#666',
    fontSize: 13,
  },
  pendingSection: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
    gap: 8,
  },
  pendingTitle: {
    fontWeight: '600',
    fontSize: 13,
    color: '#666',
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingName: {
    fontSize: 15,
  },
  acceptButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  feedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 16,
  },
});
