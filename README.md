# Onefolio: Global Exposure Intelligence

> **Geopolitical Intelligence for Your Wealth**
> The first personal finance app that visualizes your true exposure across countries, currencies, and sectors.

## 📖 Overview

**Onefolio** is a mobile portfolio tracker that goes beyond simple price monitoring. It deconstructs your investments into their fundamental components—revealing your real exposure to countries, currencies, and sectors.

Unlike traditional trackers that focus on price, Onefolio focuses on **Risk**, helping you understand your diversification through a privacy-first architecture.

## ✨ Key Features

*   **True Asset Deconstruction:** Maps assets to underlying country risk, currency, and sector.
*   **Portfolio Health Score:** Advanced diversification analysis (0-100 score).
*   **Privacy-First:** All portfolio data is stored locally on your device.
*   **Multi-Asset Support:** Stocks, ETFs, Crypto, Bonds, Real Estate, and Commodities.
*   **Premium Analytics:** Advanced exposure metrics powered by RevenueCat.

## 📚 Documentation

Detailed documentation about the project's logic, stack, and future plans can be found here:

- [**About the Project**](./hackathon-docs/about-the-project.md)
  *Inspiration, the HHI scoring algorithm, challenges, and roadmap.*
- [**Technical Documentation**](./hackathon-docs/technical-documentation.md)
  *Full tech stack, architecture diagrams, data flow, and database structure.*
- [**Written Proposal**](./hackathon-docs/written-proposal.md)
  *Deep dive into the problem, solution, and target audience.*

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npx expo start
   ```

3. **Run on a platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## 🛠 Useful Commands

### Development
```bash
# Start with cache cleared
npx expo start --clear

# Rebuild native code from scratch
npx expo prebuild --clean
```

### Build & Deploy (EAS)
```bash
# Create iOS build
eas build --platform ios

# Build and auto-submit to App Store
eas build --platform ios --auto-submit

# Local build
eas build --platform ios --local

# Submit existing build
eas submit --platform ios

# Over-the-air update
eas update --channel production
```

## 📄 License

This project is private and proprietary.