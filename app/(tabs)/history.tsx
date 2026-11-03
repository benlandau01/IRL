import { FlatList } from 'react-native';
import CheckInCard from '../../components/CheckInCard';
import { myHistory } from '../../data/mockCheckIns';

export default function HistoryScreen() {
  return (
    <FlatList
      data={myHistory}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CheckInCard checkIn={item} />}
    />
  );
}
