import { Tabs, useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { useSession } from '../../lib/auth-context';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

function SignOutButton() {
  const { signOut } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    // Stack.Protected swapping out a whole nested navigator (this Tabs
    // group) on a guard change doesn't always reconcile cleanly on its
    // own — force a clean reset back to the root instead of waiting.
    router.replace('/');
  }

  return (
    <TouchableOpacity onPress={handleSignOut} style={{ paddingHorizontal: 16 }}>
      <Text style={{ color: '#C0392B', fontSize: 14 }}>Sign out</Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Nearby',
          tabBarIcon: () => <TabIcon emoji="📍" />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: () => <TabIcon emoji="👥" />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: () => <TabIcon emoji="🕒" />,
          headerRight: () => <SignOutButton />,
        }}
      />
    </Tabs>
  );
}
