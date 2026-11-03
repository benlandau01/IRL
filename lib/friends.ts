import { supabase } from './supabase';
import { fetchProfilesByIds, type Profile } from './profiles';
import type { CheckInRow } from './checkIns';

export type FriendRequestRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
};

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function sendFriendRequest(code: string): Promise<void> {
  const myId = await currentUserId();
  const normalized = code.trim().toUpperCase();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('friend_code', normalized)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error('No one has that friend code');
  if (profile.id === myId) throw new Error("That's your own code");

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: myId, addressee_id: profile.id });
  if (error) throw error;
}

export async function fetchPendingRequests(): Promise<(FriendRequestRow & { requester: Profile })[]> {
  const myId = await currentUserId();
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('addressee_id', myId)
    .eq('status', 'pending');
  if (error) throw error;
  const rows = data ?? [];

  const profiles = await fetchProfilesByIds(rows.map((row) => row.requester_id));
  return rows
    .filter((row) => profiles[row.requester_id])
    .map((row) => ({ ...row, requester: profiles[row.requester_id] }));
}

export async function acceptFriendRequest(id: string): Promise<void> {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
  if (error) throw error;
}

async function fetchFriendIds(): Promise<string[]> {
  const myId = await currentUserId();
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);
  if (error) throw error;
  return (data ?? []).map((row) => (row.requester_id === myId ? row.addressee_id : row.requester_id));
}

export async function fetchFriendsFeed(): Promise<(CheckInRow & { profile: Profile })[]> {
  const friendIds = await fetchFriendIds();
  if (friendIds.length === 0) return [];

  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .in('user_id', friendIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const profiles = await fetchProfilesByIds(friendIds);
  return rows.filter((row) => profiles[row.user_id]).map((row) => ({ ...row, profile: profiles[row.user_id] }));
}
