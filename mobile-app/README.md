# HealthNestAI Mobile App (React Native + Expo)

## Run locally

```bash
cd mobile-app
npm install
npx expo start
```

Scan QR with **Expo Go** app (Android/iOS).

## Screens
- Dashboard → 4 action cards
- Symptom Checker → 3-step flow (select → details → AI result)
- Health Report → Vitals form → 0-100 score + insights
- Medicine Reminder → CRUD
- Profile → Stats + Pro upgrade

## Build for Play Store

```bash
npx eas build --platform android --profile production
```

Requires Expo EAS account (free tier available).
