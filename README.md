# DDBuildingTech Mobile

Expo mobile scaffold connected to the live PHP website APIs in this repo.

## Run

1. Start Apache and MySQL in XAMPP so `http://localhost/dd4` works in a browser.
2. In `mobile-app/src/config/appConfig.js`, keep `10.0.2.2` for the Android emulator.
3. If you test on a physical phone, replace `10.0.2.2` with your computer LAN IP.
4. From `mobile-app/`, run `npm install`.
5. Start Expo with `npx expo start`.

## EAS Build

Use EAS cloud builds when you want a real Android app binary instead of Expo Go.

1. Install EAS CLI:
   `npm install -g eas-cli`
2. Log in:
   `eas login`
3. From this `mobile-app` folder, start the first Android APK build:
   `eas build -p android --profile preview`
4. For a Play Store AAB later:
   `eas build -p android --profile production`

This project includes:
- `preview` profile for installable APK testing
- `production` profile for Play Store-ready AAB builds

## Current screens

- Home
- Shop
- Support
- Service Agents
- Login

## Notes

- App icon and splash use `assets/logo.png` copied from the website logo.
- Support and chat are gated behind login.
- Service-agent registration uses the live `api/vendors.php` endpoint and respects the one-registration duplicate guard added on the backend.
- Cart is local state for now; payment checkout is not wired into the mobile scaffold yet.

