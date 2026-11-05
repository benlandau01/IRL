What this project is
IRL (placeholder name, short for "in real life") is a lifestyle project and a way to get familiar with Claude Code. It is not a venture-scale company, so favor simple, boring solutions over clever ones.
The premise: when someone is out in public and instinctively reaches for their phone to scroll social media, they check in to IRL instead. The app locates them and shows who else is checked in nearby.
Platform and stack
• iOS only for now. Build with Expo (React Native) and TypeScript so Android stays an easy add later.
• Supabase for auth, Postgres, and realtime updates. Distance queries currently use plain Haversine math client-side (see lib/geo.ts) rather than PostGIS, since the test group is tiny — revisit PostGIS only if that stops being true.
• react-native-maps on Apple Maps for now, but it can't be custom-styled (customMapStyle is Google-Maps-only — verified in node_modules). Maturity roadmap below covers moving to Google Maps or Mapbox once we're off plain Expo Go.
• Test on a real iPhone through Expo Go for now. Moving to a custom dev client (EAS Build) is the next infra step — it's what unlocks custom map providers, Sign in with Apple, and production push notifications, none of which plain Expo Go supports. A paid Apple developer account ($99/yr) is needed for TestFlight sharing, Sign in with Apple, and App Store distribution.
Screens (three tabs)
1. Nearby: a map and list of people currently checked in near you.
2. Friends: a social feed of friends' check-ins: where they were, and what happened after (for example met someone, chatted, or just vibed). Visual style should feel like a social app or Strava.
3. History: your own past check-ins.
Privacy and safety defaults (suggestions, open to change)
These are starting defaults, not hard rules. Raise it with me before changing them, but they can change.
• Check-ins auto-expire after roughly 60 to 90 minutes.
• Location is fuzzed to about 100 meters rather than exact.
• Visibility is friends-only by default, with "everyone nearby" as an opt-in. (Real now, as of Phase 4 — friends table exists, default is "friends", "everyone nearby" is an explicit switch at check-in time.)
Working agreements for Claude Code
• Start in plan mode: propose an approach and wait for approval before writing code.
• Work one phase at a time and commit to git after each working step.
• Keep changes small and explain what changed in plain language.
• Ask before adding new dependencies or changing the database schema.
• Never commit secrets. Keep API keys in environment files that are git-ignored.
Phased plan
1. Scaffold the app with three tabs and mock data. (done)
2. Add auth and a real check-in that writes to the database. (done — email + 6-digit code via Supabase, no password)
3. Make Nearby query real check-ins by distance. (done)
4. Build the friends feed, including the post-check-in prompt about what happened. (done — profiles table, friend-code request/accept flow, real friends-only visibility)
5. Build the history view, then add push notifications and a gentle nudge to check in. (history view done in phase 2, as a byproduct; push notifications/nudge still open)

Design pass (in progress)
A full token-based design system ("Field": calm off-white/spruce-green, Bricolage Grotesque + DM Sans, floating glass tab bar, soft elevated cards) replaced the original flat styling, driven by a hand-off design brief. Tokens live in lib/theme.ts (ThemeProvider/useTheme — never hardcode a hex color in a component). Done so far: theme provider, fonts, the floating tab bar + embedded Check-in button, and the Nearby screen. Still flat/unstyled: Friends and History tabs — restyle those next, same tokens, same brief.

Maturity roadmap (after the design pass)
The current build runs entirely in plain Expo Go, which caps what's possible. In rough order:
6. Move to a custom dev client (EAS Build). Free to start; this is what unlocks everything below — Expo Go can't load custom native config.
7. Sign in with Apple, replacing the email+code flow's friction. Needs the $99/yr Apple Developer Program (which we'll need anyway for TestFlight/App Store) plus the dev client from #6. Apple also requires offering this if any other third-party login is offered later, so it's not just UX polish.
8. Pick Google Maps (customMapStyle support, needs a Google Cloud API key + billing enabled, free tier ~$200/mo credit) or Mapbox (nicer styling via Mapbox Studio, free tier ~50k loads/mo, no billing needed to start) to actually get the tinted map the design brief wants. Either needs the dev client.
9. App Store readiness: in-app account deletion (Apple requires this if the app allows account creation — we don't have it yet) and a hosted privacy policy page (required for the listing since we collect location + email).
Product spec notes
The core loop
Pull out phone, open IRL, tap check in, see who is around, optionally say hi. Afterward, a short prompt asks what happened, which feeds the friends feed and your history.
Open questions
• Final name and branding.
• Whether strangers can ever see each other, or only friends in v1. (Answered as of Phase 4: friends by default, strangers only if you explicitly opt into "everyone nearby" per check-in.)
• How to handle the empty-map problem: a friends-only launch with a handful of real testers is the simplest answer.
• Whether to add a lightweight way to say hi or wave without sharing contact details.
