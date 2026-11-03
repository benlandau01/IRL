import { FlatList } from 'react-native';
import CheckInCard from '../../components/CheckInCard';
import { friendsFeed } from '../../data/mockCheckIns';

export default function FriendsScreen() {
  return (
    <FlatList
      data={friendsFeed}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CheckInCard checkIn={item} />}
    />
  );
}
