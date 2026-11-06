// theme.ts — "Field" design tokens for the IRL app (placeholder name).
// Light is the default. Every color is a light/dark pair; never hardcode hex in components.

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme, type TextStyle, type ViewStyle } from 'react-native';

// ---------- Colors ----------

export type Colors = {
  bg: string;          // screen background
  surface: string;     // cards, sheets
  raised: string;      // secondary buttons, inputs, chips on surface
  glass: string;       // translucent bars (tab bar, live card); pair with expo-blur
  lineStrong: string;  // rare dividers / sheet handle
  text: string;
  text2: string;       // secondary text, captions
  accent: string;      // primary buttons, active states, stat tile
  accentText: string;  // accent-colored text on bg/surface
  accentSoft: string;  // tinted chip / active-tab background
  accentGlow: string;  // shadow color under accent buttons
  onAccent: string;    // text/icon on accent
  live: string;        // "someone is checked in now" signal; decorative only, never text
  liveGlow: string;
  mapBg: string;
  mapRoad: string;
  mapPark: string;
  mapWater: string;
  danger: string;
};

export const light: Colors = {
  bg: '#F5F3EC',
  surface: '#FCFBF7',
  raised: '#ECE9DF',
  glass: 'rgba(252,251,247,0.82)',
  lineStrong: 'rgba(31,42,36,0.18)',
  text: '#1F2A24',
  text2: '#56625B',
  accent: '#2F5D50',
  accentText: '#2F5D50',
  accentSoft: 'rgba(47,93,80,0.12)',
  accentGlow: 'rgba(47,93,80,0.28)',
  onAccent: '#FFFFFF',
  live: '#8DB360',
  liveGlow: 'rgba(141,179,96,0.25)',
  mapBg: '#E9E7DC',
  mapRoad: '#FBFAF5',
  mapPark: '#CFDDBF',
  mapWater: '#BFD6DC',
  danger: '#B3402F',
};

export const dark: Colors = {
  bg: '#0F1512',
  surface: '#172019',
  raised: '#223028',
  glass: 'rgba(23,32,25,0.78)',
  lineStrong: 'rgba(255,255,255,0.18)',
  text: '#EEF2EA',
  text2: '#A5B2A8',
  accent: '#6DB59B',
  accentText: '#8FCDB5',
  accentSoft: 'rgba(109,181,155,0.18)',
  accentGlow: 'rgba(109,181,155,0.35)',
  onAccent: '#0B1A14',
  live: '#A8D07A',
  liveGlow: 'rgba(168,208,122,0.2)',
  mapBg: '#121A16',
  mapRoad: '#1D2822',
  mapPark: '#15261D',
  mapWater: '#0F2229',
  danger: '#F08A78',
};

// ---------- Avatars ----------
// Soft earthy gradients, always with DARK ink initials (avatarInk) in both modes.

export const avatarInk = '#1F2A24';

export const avatarGradients: [string, string][] = [
  ['#F0B79A', '#E08F7A'], // clay
  ['#B5D6E2', '#8DB4D0'], // sky
  ['#F0DDA3', '#D9B96A'], // sand
  ['#BFDCA8', '#8FBF9A'], // sage
];

/** Stable gradient per person: pass their id or name. */
export function avatarGradientFor(key: string): [string, string] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return avatarGradients[h % avatarGradients.length];
}

/** Live ring around an avatar: LinearGradient colors [accent, live]. */
export const liveRing = (c: Colors): [string, string] => [c.accent, c.live];

// ---------- Spacing, radius ----------

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = {
  input: 16,
  card: 28,     // cards, bottom sheets
  sheet: 32,
  button: 24,   // 48px-tall buttons; use 22 for 44px
  pill: 999,
} as const;

export const tapTarget = 44; // minimum height for anything tappable

// ---------- Typography ----------
// Fonts (install: @expo-google-fonts/bricolage-grotesque, @expo-google-fonts/dm-sans):
//   Bricolage Grotesque 700 for display/title; DM Sans 400/500/600/700 for everything else.

export const fonts = {
  displayBold: 'BricolageGrotesque_700Bold',
  displayExtra: 'BricolageGrotesque_800ExtraBold', // wordmark only
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemi: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
} as const;

export const type = {
  display: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 36, letterSpacing: -1 },   // screen titles
  title: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26, letterSpacing: -0.4 },   // sheet + section heads
  stat: { fontFamily: fonts.displayBold, fontSize: 44, lineHeight: 44, letterSpacing: -1.3 },    // big numbers
  initials: { fontFamily: fonts.displayBold, fontSize: 16, lineHeight: 18 },
  headline: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 21, letterSpacing: -0.15 },  // names, row titles
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },                                // post text
  caption: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 18 },                       // meta, venue + distance
  label: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 16 },                           // chips, small labels
  tab: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 13 },                             // tab labels
  button: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

// ---------- Elevation ----------
// Cards float on soft shadow, not hairlines. iOS shadow props + Android elevation fallback.

export function shadows(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  const card: ViewStyle = {
    shadowColor: isDark ? '#000000' : '#283C2D',
    shadowOffset: { width: 0, height: isDark ? 12 : 10 },
    shadowOpacity: isDark ? 0.45 : 0.1,
    shadowRadius: isDark ? 28 : 24,
    elevation: 4,
  };
  const accentButton = (accentGlow: string): ViewStyle => ({
    shadowColor: accentGlow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  });
  return { card, accentButton };
}

// ---------- Provider + hook ----------

export type ThemePreference = 'light' | 'dark' | 'system';

export type Theme = {
  mode: 'light' | 'dark';
  colors: Colors;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
  fonts: typeof fonts;
  shadows: ReturnType<typeof shadows>;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<Theme | null>(null);

/** Default preference is 'light' (calm, unplugging mission). Persist the user's choice with AsyncStorage if you add a settings toggle. */
export function ThemeProvider({
  children,
  initialPreference = 'light',
}: {
  children: React.ReactNode;
  initialPreference?: ThemePreference;
}) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);

  const value = useMemo<Theme>(() => {
    const mode: 'light' | 'dark' =
      preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    return {
      mode,
      colors: mode === 'dark' ? dark : light,
      space,
      radius,
      type,
      fonts,
      shadows: shadows(mode),
      preference,
      setPreference,
    };
  }, [preference, system]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
