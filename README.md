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
![Framework](https://img.shields.io/badge/Framework-Expo%20SDK%2054-B44FFF?style=for-the-badge&logoColor=white&labelColor=050508)
![Database](https://img.shields.io/badge/Cloud-Firebase-00E5FF?style=for-the-badge&logoColor=white&labelColor=050508)
![License](https://img.shields.io/badge/License-MIT-00FF88?style=for-the-badge&logoColor=white&labelColor=050508)

<br/>

> *"A cyberpunk-themed birthday tracker that auto-schedules notifications, sends email reminders, and syncs to the cloud — all without you lifting a finger."*

<br/>

---

</div>

<br/>

## ◈ TABLE OF CONTENTS

```
01 ─── Overview
02 ─── Features
03 ─── Screenshots
04 ─── Tech Stack
05 ─── Getting Started
06 ─── Project Structure
07 ─── How It Works
08 ─── Automation: GitHub Actions
09 ─── Environment Variables
10 ─── Roadmap
11 ─── Contributing
12 ─── License
```

<br/>

---

## `01` ── OVERVIEW

**BirthdayBuddy** is a mobile app built with React Native + Expo that makes sure you never miss a birthday. Behind the slick neon interface lives a powerful system:

- 🔒 **Biometric lock screen** — fingerprint / face ID on launch  
- 🎂 **Birthday tracking** — store name, date, relationship, and notes  
- 🔔 **Auto push notifications** — scheduled at 9 AM the day before and midnight on the day  
- 📧 **Smart email reminders** — sent via EmailJS on the birthday and day before  
- ☁️ **Firebase cloud sync** — birthdays backed up and synced across devices  
- 📊 **Stats dashboard** — visual insights about your social circle  
- 🤖 **AI chat assistant** — built-in Claude-powered birthday companion  

<br/>

---

## `02` ── FEATURES

<br/>

### 🔵 CORE

| Feature | Status | Description |
|---|---|---|
| Birthday CRUD | ✅ Live | Add, edit, delete birthdays with full details |
| Biometric Auth | ✅ Live | Face ID / Fingerprint lock on app open |
| Relationship Tags | ✅ Live | Tag each person (Friend, Family, Colleague…) |
| Search & Filter | ✅ Live | Find any birthday instantly |
| Upcoming View | ✅ Live | See who's next in line |

<br/>

### 🟣 NOTIFICATIONS & REMINDERS

| Feature | Status | Description |
|---|---|---|
| Push Notifications | ✅ Live | 9 AM day-before + midnight birthday alerts |
| Email Reminders | ✅ Live | Auto-sent via EmailJS on trigger days |
| GitHub Actions Cron | 🔜 Planned | Scheduled daily email — no app open needed |
| Spam Prevention | ✅ Live | Once-per-day lock using AsyncStorage timestamps |

<br/>

### 🟢 CLOUD & SYNC

| Feature | Status | Description |
|---|---|---|
| Firebase Firestore | ✅ Live | Real-time cloud backup |
| Multi-device Sync | ✅ Live | Same data on all your devices |
| Offline Support | ✅ Live | Works without internet, syncs on reconnect |

<br/>

---

## `03` ── SCREENSHOTS

<br/>

> *Screenshots will go here once dev build is ready*

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │  │                  │
│   LOCK SCREEN    │  │  BIRTHDAYS LIST  │  │  STATS SCREEN    │
│                  │  │                  │  │                  │
│  ◈ Biometric     │  │  ◈ Card Grid     │  │  ◈ Charts        │
│  ◈ Neon UI       │  │  ◈ Countdown     │  │  ◈ Insights      │
│  ◈ Animated      │  │  ◈ Filters       │  │  ◈ Animated      │
│                  │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

<br/>

---

## `04` ── TECH STACK

<br/>

```
╔══════════════════════════════════════════════════════════════╗
║                        TECH STACK                            ║
╠══════════════════════════════════════════════════════════════╣
║  FRONTEND          React Native + Expo SDK 54               ║
║  NAVIGATION        Expo Router (file-based)                  ║
║  FONTS             Orbitron 700 + Exo2 400/600              ║
║  ICONS             @expo/vector-icons (Ionicons)             ║
║  ANIMATIONS        React Native Animated API                 ║
║  STORAGE (local)   AsyncStorage + Expo SecureStore          ║
║  STORAGE (cloud)   Firebase Firestore                        ║
║  AUTH              Expo LocalAuthentication (Biometrics)     ║
║  NOTIFICATIONS     Expo Notifications                        ║
║  EMAIL             EmailJS                                   ║
║  CALENDAR          expo-calendar (dev build only)            ║
║  CI/CD             GitHub Actions                            ║
╚══════════════════════════════════════════════════════════════╝
```

<br/>

---

## `05` ── GETTING STARTED

<br/>

### Prerequisites

Make sure you have the following installed:

```bash
node >= 18.0.0
npm >= 9.0.0
expo-cli (latest)
```

<br/>

### Installation

**1. Clone the repo**

```bash
git clone https://github.com/eshaan-kolloth/Birthday_Buddy.git
cd Birthday_Buddy
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

Create a `.env` file in the root directory (see [Environment Variables](#09--environment-variables)):

```bash
cp .env.example .env
# Fill in your keys
```

**4. Start the development server**

```bash
npx expo start
```

**5. Run on your device**

- Install **Expo Go** from the App Store / Play Store
- Scan the QR code from the terminal
- Or press `a` for Android emulator, `i` for iOS simulator

<br/>

> ⚡ **Note:** Some features (calendar integration, full biometrics) require a **development build** instead of Expo Go. See [Building a Dev Build](#development-build) below.

<br/>

---

## `06` ── PROJECT STRUCTURE

<br/>

```
Birthday_Buddy/
│
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout + tab navigation
│   ├── index.tsx               # AI Chat screen
│   ├── BirthdaysScreen.tsx     # Birthday list + management
│   ├── StatsScreen.tsx         # Analytics dashboard
│   └── LockScreen.tsx          # Biometric lock screen
│
├── utils/                      # Core logic
│   ├── storage.ts              # AsyncStorage + Birthday CRUD
│   ├── notifications.ts        # Push notifications + email triggers
│   ├── calendar.ts             # Calendar integration (dev build)
│   ├── email.ts                # EmailJS integration
│   └── firebase.ts             # Firestore cloud sync
│
├── constants/
│   └── theme.ts                # Color palette + design tokens
│
├── .github/
│   └── workflows/
│       └── birthday-emails.yml # GitHub Actions daily cron
│
├── assets/                     # Images, fonts, icons
├── app.json                    # Expo config
└── package.json
```

<br/>

---

## `07` ── HOW IT WORKS

<br/>

### 🔔 Notification System

```
USER OPENS APP
      │
      ▼
┌─────────────────────────────────┐
│  scheduleAllBirthdayNotifications│
│  (runs on every app unlock)      │
└──────────────┬──────────────────┘
               │
               ▼
    For each birthday:
    ┌─────────────────────────┐
    │  • Schedule 9 AM alert  │  ← Day before birthday
    │  • Schedule 12 AM alert │  ← Day of birthday
    └─────────────────────────┘
               │
               ▼
    Notifications fire even
    when app is CLOSED ✅
```

<br/>

### 📧 Email System

```
USER OPENS APP ON BIRTHDAY DAY
              │
              ▼
   checkAndSendBirthdayEmails()
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
Is today          Is tomorrow
birthday?         birthday?
    │                   │
    ▼                   ▼
Send "today"      Send "tomorrow"
email via         email via
EmailJS           EmailJS
    │                   │
    └─────────┬─────────┘
              │
              ▼
    Stamp timestamp in
    AsyncStorage to prevent
    duplicate emails ✅
```

<br/>

### ☁️ Firebase Sync

```
LOCAL CHANGE (add/edit/delete)
          │
          ▼
   AsyncStorage (instant)
          │
          ▼
   Firestore sync (background)
          │
          ▼
   Available on all devices ✅
```

<br/>

---

## `08` ── AUTOMATION: GITHUB ACTIONS

<br/>

> This feature sends birthday emails **automatically every day at 9 AM** — even if you never open the app.

<br/>

### How it works

A GitHub Actions workflow runs on a daily cron schedule. It:

1. Fetches all birthdays from Firebase Firestore
2. Checks if any birthday is **today** or **tomorrow**
3. Sends the email via EmailJS
4. Done — zero interaction needed

<br/>

### Setup (coming soon)

```bash
# Secrets to add to your GitHub repo:
FIREBASE_SERVICE_ACCOUNT_KEY   # Firebase admin SDK JSON
EMAILJS_SERVICE_ID
EMAILJS_TEMPLATE_ID
EMAILJS_PUBLIC_KEY
```

<br/>

```yaml
# .github/workflows/birthday-emails.yml
name: Daily Birthday Emails
on:
  schedule:
    - cron: '0 3 * * *'   # 9 AM IST = 3:30 AM UTC
  workflow_dispatch:

jobs:
  send-emails:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: node scripts/sendBirthdayEmails.js
        env:
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_KEY }}
          EMAILJS_SERVICE_ID: ${{ secrets.EMAILJS_SERVICE_ID }}
          EMAILJS_TEMPLATE_ID: ${{ secrets.EMAILJS_TEMPLATE_ID }}
          EMAILJS_PUBLIC_KEY: ${{ secrets.EMAILJS_PUBLIC_KEY }}
```

<br/>

---

## `09` ── ENVIRONMENT VARIABLES

<br/>

Create a `.env` file in the project root with the following:

```env
# ── EmailJS ──────────────────────────────────────
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key

# ── Firebase ─────────────────────────────────────
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

<br/>

> ⚠️ **Never commit your `.env` file to Git.** It's already in `.gitignore`. If you accidentally push keys, rotate them immediately.

<br/>

---

## `10` ── ROADMAP

<br/>

```
 STATUS    FEATURE
 ──────    ─────────────────────────────────────────────────────
   ✅      Biometric lock screen
   ✅      Birthday CRUD with relationship tags
   ✅      Push notifications (day-before + birthday)
   ✅      Email reminders via EmailJS
   ✅      Spam prevention (once-per-day lock)
   ✅      Firebase cloud sync
   ✅      Stats & analytics screen
   ✅      AI chat assistant
   🔜      GitHub Actions automated daily emails
   🔜      Development build (calendar + full features)
   🔜      Birthday photo attachments
   🔜      Custom notification tones
   🔜      Widget for home screen
   🔜      Apple Watch / Wear OS companion
   🔜      Birthday wishes template generator
   🔜      Multi-language support
```

<br/>

---

## `11` ── CONTRIBUTING

<br/>

Contributions are welcome! Here's how:

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/your-amazing-feature

# 3. Commit your changes
git commit -m "feat: add amazing feature"

# 4. Push to your branch
git push origin feature/your-amazing-feature

# 5. Open a Pull Request
```

<br/>

Please follow the existing code style and add comments for complex logic.

<br/>

---

## `12` ── LICENSE

<br/>

```
MIT License

Copyright (c) 2025 Eshaan Kolloth

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction...
```

Full license text: [LICENSE](./LICENSE)

<br/>

---

<div align="center">

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Built with  ♥  by  Eshaan Kolloth                      ║
║                                                           ║
║   [ NEVER MISS WHAT MATTERS ]                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

<br/>

**[⬆ Back to top](#)**

</div>
