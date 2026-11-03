import { supabase } from './supabase';

export type CheckInRow = {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  note: string | null;
  visibility: 'friends' | 'everyone';
  created_at: string;
  expires_at: string;
};

const METERS_PER_DEGREE_LAT = 111_320;

// Jitters a coordinate by up to `meters` in a random direction, per CLAUDE.md's ~100m fuzzing default.
export function fuzzCoordinate(lat: number, lng: number, meters = 100) {
  const randomDistance = Math.random() * meters;
  const randomAngle = Math.random() * 2 * Math.PI;
  const deltaLat = (randomDistance * Math.cos(randomAngle)) / METERS_PER_DEGREE_LAT;
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180);
  const deltaLng = (randomDistance * Math.sin(randomAngle)) / metersPerDegreeLng;
  return { lat: lat + deltaLat, lng: lng + deltaLng };
}

export async function insertCheckIn(
  coords: { lat: number; lng: number },
  visibility: 'friends' | 'everyone' = 'friends'
): Promise<CheckInRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('check_ins')
    .insert({
      user_id: userData.user.id,
      lat: coords.lat,
      lng: coords.lng,
      visibility,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCheckInNote(id: string, note: string): Promise<void> {
  const { error } = await supabase.from('check_ins').update({ note }).eq('id', id);
  if (error) throw error;
}

export async function fetchMyHistory(): Promise<CheckInRow[]> {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchNearbyCheckIns(): Promise<CheckInRow[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('visibility', 'everyone')
    .neq('user_id', userData.user.id);
  if (error) throw error;
  return data ?? [];
}
