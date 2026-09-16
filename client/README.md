# CarCare — mobile client

> Your digital garage.

React Native (Expo, TypeScript) front end for the CarCare NestJS API. Dark-first,
black/red/white automotive identity, English and Bulgarian.

## Running it

```bash
cd client
npm install
cp .env.example .env     # then fill in the values (see below)
npm start                # press i for iOS, a for Android, w for web
```

The API must be running separately (`cd api && npm run start:dev`).

### Environment

Only `EXPO_PUBLIC_*` variables reach the bundle, and everything the client needs
is public by design. **No service-role key belongs in this app.**

| Variable                        | Notes                                                                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`           | `http://localhost:3030/api/v1` for the iOS simulator, `http://10.0.2.2:3030/api/v1` for the Android emulator, `http://<LAN-IP>:3030/api/v1` for a physical device |
| `EXPO_PUBLIC_SUPABASE_URL`      | Same project the API verifies tokens against                                                                                                                      |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key — RLS-restricted and safe to ship                                                                                                                 |

### Scripts

| Command             | What it does                                                              |
| ------------------- | ------------------------------------------------------------------------- |
| `npm start`         | Expo dev server                                                           |
| `npm run typecheck` | `tsc --noEmit`                                                            |
| `npm run lint`      | ESLint                                                                    |
| `npm run format`    | Prettier                                                                  |
| `npm run assets`    | Regenerates the launcher/splash artwork from `scripts/generate-assets.js` |

## How it is put together

```
app/                      Expo Router routes (file = screen)
  (auth)/                 login, register — the only routes reachable signed out
  (tabs)/                 home, vehicles, maintenance, expenses, documents
  vehicle/[id]/           detail, edit, mileage
  maintenance/ expenses/ documents/   create + detail
  onboarding/ reminders/ statistics/ settings/
src/
  api/                    One module per resource; the only place `fetch` is called
  hooks/                  TanStack Query hooks — the server-state boundary
  components/ui/          Button, Card, Badge, EmptyState, Sheet, …
  components/<feature>/   Vehicle, maintenance, expense, document, dashboard pieces
  components/form/        RHF-bound fields sharing one label/error frame
  services/               location, documents, notifications, analytics seams
  theme/                  Colours, type scale, spacing — the single source of style
  i18n/                   i18next setup + en/bg locales
  validation/             Zod schema factories (messages come from i18next)
```

**Rules the codebase keeps to**

- UI never calls the API directly. Screens use hooks; hooks call `src/api/*`;
  only `src/api/client.ts` knows about `fetch`, tokens, timeouts and error shape.
- Server data lives in TanStack Query. Zustand holds client state only — the
  selected vehicle, the preferred currency.
- Every user-facing string goes through i18next. English and Bulgarian are kept
  at exact key parity.
- Numbers, dates and money are formatted through `src/utils/format.ts`, never
  concatenated by hand: Bulgarian groups `145 320 км`, English `145,320 km`.

## Authentication

Supabase issues and refreshes the session; the NestJS API only verifies the
token it is handed. The session is persisted to the Keychain/Keystore through
`expo-secure-store`, chunked because a session exceeds SecureStore's 2 KB
per-entry limit. `useAuth()` exposes `user`, `session`, `isLoading`, `signIn`,
`signUp`, `signOut`; the root layout guards every route on it.

Registration goes straight to Supabase rather than through the API's
`/auth/login`, which exists so Swagger can mint a token and does not return a
refresh token.

## Mileage: two numbers, never merged

- `odometerKm` — the reading the driver confirmed by hand. Ground truth.
- `estimatedMileageKm` — that baseline plus GPS distance recorded since.

The UI always shows the confirmed odometer as the headline and the estimate as a
delta beneath it. Confirming a new reading re-anchors the estimate server-side,
which is what stops trip distance being counted twice.

## What is mocked, and how to unmock it

The API has no documents or reminders module, so:

- **Documents** — `src/api/documents.ts` delegates to an on-device store
  (`src/services/documents/documentStore.ts`) shaped exactly like a REST
  resource. When `/vehicles/:id/documents` ships, rewrite that one file to call
  `apiClient` and delete the store. Hooks, screens and types do not change.
- **Reminders** — derived on the client in `src/api/reminders.ts` from
  maintenance next-due markers and document expiry dates, using the same
  thresholds the API applies (14 days / 500 km). There is nothing to unmock
  unless reminders become a stored resource.

Everything else — vehicles, maintenance, expenses, trips, dashboard totals —
talks to the real API.

## Deliberately out of scope

Background GPS tracking, OCR, push delivery and analytics are left as interfaces
(`src/services/*`) with no implementation. `locationService` handles permissions
and a single fix; `tripService` already reduces a position trace to the summary
the API stores, so turning tracking on does not reach into the UI.

## Charts

Built directly on `react-native-svg` rather than a chart library, so the palette
stays inside the brand. Monthly spending is one series, so it carries one hue and
encodes magnitude in bar length — a red ramp was tested against the
colour-vision checks and rejected, because adjacent steps of a single hue are
indistinguishable under deuteranopia and would have been redundant with length
anyway. Tapping a bar reveals its value; every bar carries an accessible label.
