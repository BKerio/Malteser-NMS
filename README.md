# Multerser 
### Premium Expo Authentication & Theme Starter

Multerser is a professional-grade React Native application built with **Expo SDK 54**. It features a stunning, high-conversion authentication suite and a global theme system, designed to serve as a rock-solid foundation for modern mobile applications.

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54.0.0-black?style=for-the-badge&logo=expo" />
  <img src="https://img.shields.io/badge/React_Native-0.81.0-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript" />
</p>

---

## Key Features

- **Complete Auth Suite**: High-fidelity Login, Sign Up, and Forgot Password screens.
- **Premium UI/UX**: Custom design system based on modern standards with smooth transitions and glassmorphism elements.
- **Global Theme Support**: Fully integrated Light and Dark modes using a centralized `ThemeContext`.
- **Expo Router**: Modern file-based routing with strict TypeScript path validation.
- **Responsive Design**: Optimized for all screen sizes with robust keyboard handling and safe area management.
- **Developer Friendly**: Pre-configured with aliases (`@/`), offline mode support, and clean project structure.

---

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 54)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (Typed Routes)
- **Styling**: Vanilla React Native StyleSheet with global theme tokens
- **Icons**: [Expo Vector Icons](https://docs.expo.dev/guides/icons/) (Ionicons & MaterialCommunityIcons)
- **Backgrounds**: [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS)
- [Expo Go](https://expo.dev/go) app on your physical device

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/BKerio/Malteser-NMS.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
Start the development server with a clean cache:
```bash
npm start
```
*Note: The project is pre-configured to run in **offline mode** to bypass account requirements. Ensure your phone and computer are on the same network.*

---

## Project Structure

```text
src/
├── app/               # Expo Router file-based routes
│   ├── (auth)/        # Authentication flow (Login, Signup, etc.)
│   ├── (main)/        # Authenticated application screens
│   └── _layout.tsx    # Root layout with ThemeProvider
├── components/        # Reusable UI components
├── context/           # Global State (ThemeContext, etc.)
└── assets/            # Local images and icons
```

---

## Configuration

- **Theme Settings**: Modify colors in `src/context/ThemeContext.tsx`.
- **App Metadata**: Update name, slug, and versions in `app.json`.
- **Environment**: Global flags like `EXPO_OFFLINE` are managed in the `.env` file.
