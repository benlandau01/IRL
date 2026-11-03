What this project is
IRL (placeholder name, short for "in real life") is a lifestyle project and a way to get familiar with Claude Code. It is not a venture-scale company, so favor simple, boring solutions over clever ones.
The premise: when someone is out in public and instinctively reaches for their phone to scroll social media, they check in to IRL instead. The app locates them and shows who else is checked in nearby.
Platform and stack
• iOS only for now. Build with Expo (React Native) and TypeScript so Android stays an easy add later.
• Supabase for auth, Postgres with PostGIS for distance queries, and realtime updates.
• Mapbox or react-native-maps for the map.
• Test on a real iPhone through Expo Go or a development build. A paid Apple developer account is only needed for TestFlight sharing.
Screens (three tabs)
1. Nearby: a map and list of people currently checked in near you.
2. Friends: a social feed of friends' check-ins: where they were, and what happened after (for example met someone, chatted, or just vibed). Visual style should feel like a social app or Strava.
3. History: your own past check-ins.
Privacy and safety defaults (suggestions, open to change)
These are starting defaults, not hard rules. Raise it with me before changing them, but they can change.
• Check-ins auto-expire after roughly 60 to 90 minutes.
• Location is fuzzed to about 100 meters rather than exact.
• Visibility is friends-only by default, with "everyone nearby" as an opt-in.
Working agreements for Claude Code
• Start in plan mode: propose an approach and wait for approval before writing code.
• Work one phase at a time and commit to git after each working step.
• Keep changes small and explain what changed in plain language.
• Ask before adding new dependencies or changing the database schema.
• Never commit secrets. Keep API keys in environment files that are git-ignored.
Phased plan
1. Scaffold the app with three tabs and mock data.
2. Add auth and a real check-in that writes to the database.
3. Make Nearby query real check-ins by distance.
4. Build the friends feed, including the post-check-in prompt about what happened.
5. Build the history view, then add push notifications and a gentle nudge to check in.
Product spec notes
The core loop
Pull out phone, open IRL, tap check in, see who is around, optionally say hi. Afterward, a short prompt asks what happened, which feeds the friends feed and your history.
Open questions
• Final name and branding.
• Whether strangers can ever see each other, or only friends in v1.
• How to handle the empty-map problem: a friends-only launch with a handful of real testers is the simplest answer.
• Whether to add a lightweight way to say hi or wave without sharing contact details.
