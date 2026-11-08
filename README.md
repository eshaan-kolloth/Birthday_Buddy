<div align="center">

```
██████╗ ██╗██████╗ ████████╗██╗  ██╗██████╗  █████╗ ██╗   ██╗
██╔══██╗██║██╔══██╗╚══██╔══╝██║  ██║██╔══██╗██╔══██╗╚██╗ ██╔╝
██████╔╝██║██████╔╝   ██║   ███████║██║  ██║███████║ ╚████╔╝
██╔══██╗██║██╔══██╗   ██║   ██╔══██║██║  ██║██╔══██║  ╚██╔╝
██████╔╝██║██║  ██║   ██║   ██║  ██║██████╔╝██║  ██║   ██║
╚═════╝ ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝

██████╗ ██╗   ██╗██████╗ ██████╗ ██╗   ██╗
██╔══██╗██║   ██║██╔══██╗██╔══██╗╚██╗ ██╔╝
██████╔╝██║   ██║██║  ██║██║  ██║ ╚████╔╝
██╔══██╗██║   ██║██║  ██║██║  ██║  ╚██╔╝
██████╔╝╚██████╔╝██████╔╝██████╔╝   ██║
╚═════╝  ╚═════╝ ╚═════╝ ╚═════╝    ╚═╝
```

### `[ NEVER FORGET A BIRTHDAY AGAIN ]`

<br/>

![Platform](https://img.shields.io/badge/Platform-React%20Native-00E5FF?style=for-the-badge&logoColor=white&labelColor=050508)
![Framework](https://img.shields.io/badge/Framework-Expo%20SDK%2058-B44FFF?style=for-the-badge&logoColor=white&labelColor=050508)
![Database](https://img.shields.io/badge/Cloud-Firebase-00E5FF?style=for-the-badge&logoColor=white&labelColor=050508)
![License](https://img.shields.io/badge/License-MIT-00FF88?style=for-the-badge&logoColor=white&labelColor=050508)

<br/>

> _"A cyberpunk-themed birthday tracker that schedules reminders, emails you before the big day, and backs up to the cloud."_

<br/>

---

</div>

<br/>

## ◈ TABLE OF CONTENTS

```
01 ─── Overview
02 ─── Features
03 ─── Tech Stack
04 ─── Getting Started
05 ─── Keeping up with Expo SDK releases
06 ─── Project Structure
07 ─── How It Works
08 ─── Automation: GitHub Actions
09 ─── Environment Variables
10 ─── Security notes
11 ─── Roadmap
12 ─── License
```

<br/>

---

## `01` ── OVERVIEW

**BirthdayBuddy** is a mobile app built with React Native + Expo that makes sure you never miss a birthday.

- 🔒 **Lock screen** — Face ID / fingerprint / device passcode on launch, and again after the app has been in the background for 30 seconds
- 🎂 **Birthday tracking** — name, date, relationship and notes; add, edit and delete
- 🔔 **Reminders** — a notification at 9 AM the day before and at midnight on the day, repeating **every year** even if you never reopen the app
- 📧 **Email reminders** — sent through EmailJS, by the app and by a daily GitHub Action (never twice for the same birthday)
- ☁️ **Cloud backup** — every change is queued and retried until it reaches Firestore; reinstalling restores your list
- 📊 **Stats** and a **calendar** view
- 🤖 **Chat assistant** — an AI chat (Groq) that can add, update and delete birthdays for you (deletes ask for confirmation)

<br/>

---

## `02` ── FEATURES

| Feature | Details |
| --- | --- |
| Add / edit / delete | Edit covers name, date, relationship and notes. Deletes always ask first. |
| Search | Filter the Birthdays tab by name or relationship. |
| Calendar sync | Each birthday is mirrored into a "BirthdayBuddy" calendar on the device (not available on web). |
| Notifications | Grouped by date, yearly repeating. Feb 29 birthdays are observed on Feb 28 in non-leap years. |
| Emails | Day-before and day-of. A shared marker in Firestore stops the app and the GitHub Action from both sending. |
| Cloud backup | Offline-safe write queue + a daily reconcile. See _How it works_ for the limits (it is a backup, not live multi-device sync). |
| Automatic updates | Installed builds update themselves over the air — see [section 05](#05--keeping-up-with-expo-sdk-releases). |

<br/>

---

## `03` ── TECH STACK

```
╔══════════════════════════════════════════════════════════════╗
║  FRONTEND          React Native + Expo SDK 58                ║
║  NAVIGATION        Expo Router (file-based)                  ║
║  FONTS             Orbitron 700 + Exo2 400/600               ║
║  ANIMATIONS        React Native Animated API                 ║
║  STORAGE (local)   AsyncStorage                              ║
║  STORAGE (cloud)   Firebase Firestore (REST)                 ║
║  LOCK              Expo LocalAuthentication                  ║
║  NOTIFICATIONS     Expo Notifications (yearly triggers)      ║
║  EMAIL             EmailJS                                   ║
║  CALENDAR          expo-calendar (device build only)         ║
║  UPDATES           expo-updates (EAS Update, OTA)            ║
║  CI/CD             GitHub Actions                            ║
╚══════════════════════════════════════════════════════════════╝
```

<br/>

---

## `04` ── GETTING STARTED

Requirements: Node 20.19+ (Node 24 recommended) and npm 10+.

```bash
git clone https://github.com/eshaan-kolloth/Birthday_Buddy.git
cd Birthday_Buddy
npm install
cp .env.example .env   # then fill it in — see section 09
```

Start the dev server:

```bash
npm start          # opens in Expo Go (project must match Expo Go's SDK)
npm run dev        # opens in your development build (recommended, see section 05)
```

Other scripts:

```bash
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm test           # unit tests (Node's built-in runner)
```

> ⚡ Calendar sync and some biometric features need a **development build**; they are limited in Expo Go.

<br/>

---

## `05` ── KEEPING UP WITH EXPO SDK RELEASES

**The problem.** Expo Go on an iPhone updates itself through the App Store and can only open the _latest_ Expo SDK ("Project is incompatible with this version of Expo Go"). Each time Expo ships a new SDK, a project that has not upgraded stops opening.

**An installed app cannot upgrade its own SDK.** The SDK is compiled into the app binary. What _can_ be automatic is everything around it, and that is what this repo sets up:

| Layer | What it does | Setup |
| --- | --- | --- |
| **Early warning** | `npm start` prints a warning as soon as a newer SDK exists. | none |
| **Automatic upgrade PR** | `.github/workflows/expo-sdk-watch.yml` checks weekly, runs `expo install --fix`, runs typecheck/lint/tests and opens a PR (a draft if something broke). Merging it is one click. | Enable _Settings → Actions → General → Allow GitHub Actions to create and approve pull requests_ |
| **CI** | `.github/workflows/ci.yml` runs typecheck, lint and tests on every push/PR. | none |
| **Automatic OTA updates** | `.github/workflows/eas-update.yml` publishes every green push to `main` with EAS Update. Installed builds download it in the background and apply it while the app is locked. | Add an `EXPO_TOKEN` repository secret ([create one](https://expo.dev/settings/access-tokens)) |
| **Safe by construction** | `runtimeVersion` uses the `fingerprint` policy, so an update is only ever delivered to builds whose native code matches. An SDK upgrade can never be pushed to an old binary. | already configured |

**Stop depending on Expo Go (the permanent fix).** A _development build_ is your own copy of the Expo Go shell, pinned to your project's SDK. It never auto-updates to a different SDK:

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android   # free
eas build --profile development --platform ios       # needs an Apple Developer account
npm run dev                                          # starts Metro for the dev build
```

Install the resulting build once, then keep developing with `npm run dev`. You only rebuild when you upgrade the SDK or add a native module. (A physical iPhone can only run a development build if you have an Apple Developer Program membership; without one, Expo Go is the only option and upgrading the SDK promptly — which the PR bot above automates — is the way to stay compatible.)

**When an SDK upgrade lands:** merge the PR, then run `eas build` for the profiles you use. OTA updates cannot change the SDK, which is exactly why `fingerprint` keeps old builds on old JS until they are rebuilt.

<br/>

---

## `06` ── PROJECT STRUCTURE

```
Birthday_Buddy/
├── app/                         # Expo Router screens (routes only)
│   ├── _layout.tsx              # Lock gate, re-lock, OTA updates, tabs
│   ├── index.tsx                # Chat tab (AI assistant + Add / View / Edit)
│   ├── BirthdaysScreen.tsx      # Birthday list + search
│   └── StatsScreen.tsx          # Analytics
│
├── components/                  # LockScreen, modals, calendar, chat bubbles, …
│
├── utils/
│   ├── birthdayService.ts       # The ONE place that changes birthdays
│   ├── storage.ts               # AsyncStorage (serialised, corruption-safe)
│   ├── cloudStorage.ts          # Firestore REST + offline write queue
│   ├── notifications.ts         # Yearly reminders + email checks
│   ├── calendar.ts              # Device calendar
│   ├── email.ts                 # EmailJS
│   ├── dates.ts                 # Shared date logic (leap days, countdowns)
│   ├── chatActions.ts           # Parses the AI's SAVE/DELETE tags
│   ├── appUpdates.ts            # OTA update hook
│   └── *.test.mjs               # Unit tests
│
├── scripts/
│   ├── sendBirthdayEmails.js    # Daily GitHub Action job
│   └── checkSdk.js              # SDK early-warning (runs on npm start)
│
├── constants/                   # theme.ts, config.ts
└── .github/workflows/           # birthday-emails, ci, eas-update, expo-sdk-watch
```

<br/>

---

## `07` ── HOW IT WORKS

**Every change goes through `utils/birthdayService.ts`.** Adding, editing or deleting — from a modal, the list, or the chat AI — updates local storage first, then reminders, the device calendar and the cloud, so they can't drift apart.

**Reminders.** All reminders are rebuilt after each change and use yearly repeating triggers, grouped by date.

**Cloud backup.** Writes go into a persisted queue and are retried until Firestore accepts them. On a **fresh install** the list is restored from the cloud. Once a day the app also pushes anything the cloud is missing. It never deletes cloud data it does not know about, so this is a backup — **not** live multi-device sync: edits made on a second device are not merged back.

**Emails.** Whoever runs first (the app or the GitHub Action) records a marker in `users/<id>/emailLog`; the other one skips it. The Firestore rules must allow that collection (see section 10).

<br/>

---

## `08` ── AUTOMATION: GITHUB ACTIONS

| Workflow | When | What |
| --- | --- | --- |
| `birthday-emails.yml` | daily, 09:00 IST | Emails today's/tomorrow's birthdays. The job **fails visibly** if any email fails. |
| `ci.yml` | push / PR | typecheck, lint, tests |
| `eas-update.yml` | push to `main` | Publishes an OTA update (needs `EXPO_TOKEN`) |
| `expo-sdk-watch.yml` | weekly | Opens an Expo SDK upgrade PR |

Secrets for the email job: `FIREBASE_SERVICE_ACCOUNT_KEY` (the Firebase **admin** JSON, pasted as a secret — never committed), `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`.

> GitHub switches off scheduled workflows in a repository that has had no activity for 60 days. If the daily emails ever stop, open the Actions tab and re-enable them.

<br/>

---

## `09` ── ENVIRONMENT VARIABLES

Copy `.env.example` to `.env`:

```env
EXPO_PUBLIC_GROQ_API_KEY=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_EMAILJS_SERVICE_ID=
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=
# optional
EXPO_PUBLIC_CHAT_API_URL=      # your own proxy, keeps the key out of the app
EXPO_PUBLIC_CHAT_MODEL=
EXPO_PUBLIC_CLOUD_USER_ID=
```

<br/>

---

## `10` ── SECURITY NOTES

- **`EXPO_PUBLIC_*` values are inside the app bundle.** Anyone with the app can read the Groq key. Set a spending limit on it, or point `EXPO_PUBLIC_CHAT_API_URL` at a small proxy that holds the key.
- **Firestore is accessed without authentication.** The rules therefore have to allow open read/write on `users/<id>/birthdays` and `users/<id>/emailLog`, which means anyone who knows the project id can read or change that data. For a personal app this is a trade-off; to close it, add Firebase Authentication and restrict the rules to your uid.
- **Chat sends your saved birthdays (names, dates, relationships) to the AI provider** with each message.
- **Never commit the Firebase admin key.** It is git-ignored (`*adminsdk*.json`); keep the only copy in the `FIREBASE_SERVICE_ACCOUNT_KEY` Actions secret and move the local file out of the project folder.
- Birthdays stored on the device are not encrypted; the lock screen protects the app UI, not the storage.

<br/>

---

## `11` ── ROADMAP

```
 ✅  Lock screen with re-lock
 ✅  Birthday CRUD, search, notes
 ✅  Yearly reminders + shared-dedupe emails
 ✅  Offline-safe cloud backup
 ✅  Stats, calendar, AI assistant
 ✅  Automatic OTA updates + SDK upgrade PRs
 🔜  Firebase Auth (close the open Firestore rules)
 🔜  Live multi-device sync (needs delete tombstones)
 🔜  Birthday photos, home-screen widget, custom tones
```

<br/>

---

## `12` ── LICENSE

MIT — see [LICENSE](./LICENSE). Built with ♥ by Eshaan Kolloth.
