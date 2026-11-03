export type CheckIn = {
  id: string;
  userName: string;
  initials: string;
  avatarColor: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  timestamp: string;
  note: string;
  friendsOnly: boolean;
};

// Fixed mock "you are here" coordinate (SF Ferry Building) — replaced by real geolocation in Phase 2.
export const MOCK_USER_LOCATION = { lat: 37.7955, lng: -122.3937 };

export const nearbyCheckIns: CheckIn[] = [
  {
    id: 'n1',
    userName: 'Maya Chen',
    initials: 'MC',
    avatarColor: '#F28B82',
    lat: 37.7961,
    lng: -122.3944,
    distanceMeters: 90,
    timestamp: '2026-11-02T18:40:00Z',
    note: 'Grabbing coffee before the walk',
    friendsOnly: false,
  },
  {
    id: 'n2',
    userName: 'Jordan Lee',
    initials: 'JL',
    avatarColor: '#78D9EC',
    lat: 37.7949,
    lng: -122.3929,
    distanceMeters: 140,
    timestamp: '2026-11-02T18:35:00Z',
    note: 'At the farmers market',
    friendsOnly: true,
  },
  {
    id: 'n3',
    userName: 'Sam Patel',
    initials: 'SP',
    avatarColor: '#A7D97E',
    lat: 37.7958,
    lng: -122.3920,
    distanceMeters: 210,
    timestamp: '2026-11-02T18:20:00Z',
    note: 'Reading by the water',
    friendsOnly: false,
  },
];

export const friendsFeed: CheckIn[] = [
  {
    id: 'f1',
    userName: 'Priya Nair',
    initials: 'PN',
    avatarColor: '#FBBC78',
    lat: 37.7694,
    lng: -122.4862,
    distanceMeters: 0,
    timestamp: '2026-11-01T20:15:00Z',
    note: 'Met up with two strangers at the dog park, ended up chatting for an hour',
    friendsOnly: true,
  },
  {
    id: 'f2',
    userName: 'Diego Ramirez',
    initials: 'DR',
    avatarColor: '#C58AF9',
    lat: 37.8044,
    lng: -122.2712,
    distanceMeters: 0,
    timestamp: '2026-10-31T17:05:00Z',
    note: 'Just vibed, good people watching',
    friendsOnly: true,
  },
  {
    id: 'f3',
    userName: 'Maya Chen',
    initials: 'MC',
    avatarColor: '#F28B82',
    lat: 37.8199,
    lng: -122.4783,
    distanceMeters: 0,
    timestamp: '2026-10-30T15:30:00Z',
    note: 'Said hi to someone also reading the same book',
    friendsOnly: true,
  },
];

export const myHistory: CheckIn[] = [
  {
    id: 'h1',
    userName: 'You',
    initials: 'ME',
    avatarColor: '#7CA6E8',
    lat: 37.7694,
    lng: -122.4862,
    distanceMeters: 0,
    timestamp: '2026-11-01T19:50:00Z',
    note: 'Watched the sunset, chatted with a dog owner',
    friendsOnly: true,
  },
  {
    id: 'h2',
    userName: 'You',
    initials: 'ME',
    avatarColor: '#7CA6E8',
    lat: 37.7955,
    lng: -122.3937,
    distanceMeters: 0,
    timestamp: '2026-10-29T13:10:00Z',
    note: 'Quick coffee, no one around',
    friendsOnly: false,
  },
];
