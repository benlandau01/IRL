import { StyleSheet, Text, View } from 'react-native';

export type CheckInCardData = {
  userName: string;
  initials: string;
  avatarColor: string;
  timestamp: string;
  note?: string | null;
};

function timeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function CheckInCard({ checkIn }: { checkIn: CheckInCardData }) {
  return (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: checkIn.avatarColor }]}>
        <Text style={styles.avatarText}>{checkIn.initials}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{checkIn.userName}</Text>
          <Text style={styles.time}>{timeAgo(checkIn.timestamp)}</Text>
        </View>
        <Text style={styles.note}>{checkIn.note ?? 'Checked in'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontWeight: '600',
    fontSize: 15,
  },
  time: {
    color: '#888',
    fontSize: 13,
  },
  note: {
    marginTop: 2,
    color: '#333',
    fontSize: 14,
  },
});
