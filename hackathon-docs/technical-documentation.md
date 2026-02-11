# Onefolio — Technical Documentation

## Tech Stack

| Layer | Technology |
|---|---|
| **Mobile App** | React Native 0.81 + Expo SDK 54 (TypeScript) |
| **Navigation** | Expo Router v6 (file-based, protected routes) |
| **Styling** | NativeWind v4 (Tailwind CSS for React Native) |
| **Data Fetching** | TanStack React Query v5 (aggressive caching) |
| **Local Storage** | expo-sqlite KV Store (privacy-first, all portfolio data stays on device) |
| **Backend** | Next.js on Vercel (auth API + finance data proxy with caching) |
| **Database** | Supabase (PostgreSQL) for user accounts |
| **Financial Data** | Yahoo Finance open-source API (self-hosted on Vercel) |
| **Exchange Rates** | fxratesapi.com (real-time, 6h cached locally) |
| **Subscriptions** | RevenueCat |
| **Auth** | Apple Sign In, Google Sign In, Email OTP |
| **Security** | Biometric lock (Face ID / Touch ID), blur overlay on background |

---

## Architecture

```
┌────────────────────────────────────┐
│         ONEFOLIO (Expo)            │
│  Local SQLite ← Assets, prefs      │
│  React Query  ← Prices, news       │
│  RevenueCat   ← Subscriptions      │
└──────────────┬─────────────────────┘
               │ HTTPS
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│  Next.js API │  │  RevenueCat  │
│  (Vercel)    │  │  API         │
│              │  └──────────────┘
│  /auth/*  → Supabase (users)
│  /finance/* → Yahoo Finance API (self-hosted on Vercel)
│             → fxratesapi.com (exchange rates)
└──────────────┘
```

**Key design decision:** All portfolio data (assets, transactions) is stored **locally on device** — nothing financial ever leaves the user's phone. The backend only handles auth and proxies market data.

---

## RevenueCat Implementation

### Initialization
RevenueCat is initialized at app startup (`app/_layout.tsx`) with platform-specific API keys from environment variables. `Purchases.configure()` is called once at module scope before any component renders.

### User Identity
On sign-in, we call `Purchases.logIn(userId)` to link purchases to the authenticated user, along with `setEmail()` and `setDisplayName()` for the RevenueCat dashboard. On sign-out, `Purchases.logOut()` resets to anonymous.

### Subscription State (React Context)
A `SubscriptionProvider` wraps the entire app and exposes `isPremium` via `useSubscription()`:
- Checks `Purchases.getCustomerInfo()` on mount
- Listens for real-time changes via `Purchases.addCustomerInfoUpdateListener()` (handles renewals, cancellations, cross-device sync)
- Entitlement key: `"Pro access"`

### Paywall
Uses **RevenueCat's native paywall UI** (`react-native-purchases-ui`):
- `RevenueCatUI.presentPaywall()` — show unconditionally
- `RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: "Pro access" })` — show only if user lacks entitlement

### Utilities
- `hasActiveSubscription()` — checks `entitlements.active["Pro access"]`
- `isCurrentlyOnTrial()` — checks `entitlement.periodType === "TRIAL"`
- `hasUsedTrialBefore()` — checks `entitlements.all` to detect prior trial usage
- Typed error handling classifies purchase failures (cancelled, network, store problem, payment pending) with user-friendly messages

### Monetization
| Free | Premium (RevenueCat) |
|---|---|
| Up to 10 assets, basic health score | Unlimited assets, advanced exposure analytics, CSV export |
