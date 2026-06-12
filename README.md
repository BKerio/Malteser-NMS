# NMS Responder

Mobile app for **Drivers**, **EMTs**, and **Nurses** in the NMS Emergency Operations Center system.

## Features

- JWT login against the NMS backend (`POST /auth/login`)
- View active crew assignment (`GET /tasks/active`)
- Advance task status through the response lifecycle (`PATCH /tasks/:id/status`)
- Submit pre-hospital clinical notes (`POST /tasks/:id/patient-data`)
- Automatic GPS location sync for drivers (`POST /fleet/location`)
- Real-time task updates via Socket.io (`task:assigned`, `task:updated`)

## Setup

```bash
cd mobileapp
npm install
cp .env.example .env
```

### API URL

| Environment | `EXPO_PUBLIC_API_URL` |
|-------------|------------------------|
| Android emulator | `http://10.0.2.2:3000` (default in dev) |
| iOS simulator | `http://localhost:3000` (default in dev) |
| Physical device | `http://<your-computer-lan-ip>:3000` |

Ensure the backend is running and `CORS_ORIGIN=*` (or includes the Expo dev origin).

## Run

```bash
npm start
# Then press a (Android) or i (iOS) in the Expo CLI
```

## Test users

Create responder users via the admin portal or `backend/scripts/create-user.ts` with roles `DRIVER`, `EMT`, or `NURSE`. Dispatch must assign a task from the web dispatcher portal before the app shows an active assignment.

## Tech stack

- Expo SDK 54 + React Native 0.81
- Expo Router, Axios, Socket.io client, Expo Location
