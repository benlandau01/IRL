import { supabase } from './supabase';

export type Profile = {
  id: string;
  display_name: string;
  friend_code: string;
  created_at: string;
};

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // unambiguous: no I/O/0/1

function randomFriendCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProfile(displayName: string): Promise<Profile> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Not signed in');

  // Collisions are astronomically unlikely at 6 chars from a 33-letter
  // alphabet, but retry a few times rather than assume.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userData.user.id, display_name: displayName, friend_code: randomFriendCode() })
      .select()
      .single();
    if (!error) return data;
    if (error.code !== '23505') throw error; // not a unique-violation, give up
  }
  throw new Error('Could not generate a unique friend code — try again');
}

export async function fetchProfilesByIds(ids: string[]): Promise<Record<string, Profile>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase.from('profiles').select('*').in('id', ids);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]));
}
