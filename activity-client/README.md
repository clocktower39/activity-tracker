# activity-tracker-app

This is a simple, free activity tracker/to-do list that will help keep your life organized everyday.

Add custom tasks, select their intervals and custom category, visualize your data with charts and you will soon be able to track your streaks!

React 19 + Vite 7 + Redux 5 + MUI 7 PWA. See the [top-level README](../README.md) and [ARCHITECTURE.md](../ARCHITECTURE.md) for the full picture.

## Scripts

| Command      | Purpose                                  |
|--------------|------------------------------------------|
| `yarn dev`   | Vite dev server (default port 5173)      |
| `yarn build` | Production bundle into `dist/`           |
| `yarn lint`  | ESLint over `**/*.{js,jsx}`              |
| `yarn preview` | Serve the production bundle locally   |

## Layout

```
src/
├── App.jsx           # Theme + Router
├── App.css
├── main.jsx          # Redux Provider + StrictMode
├── theme.jsx         # Light/dark theme factory (reads Redux)
├── index.css
├── Redux/            # store, reducer, actions, initial state
├── Components/       # Log / Settings / Auth / Navbar
├── Hooks/            # useLongPress, useWindowSize
├── utils/            # intervals, notifications
└── assets/
public/               # PWA manifest + icons + .htaccess
```

## API base URL

`src/Redux/actions.jsx` currently hard-codes the production API:

```js
const serverURL = "https://myactivitytracker.herokuapp.com";
```

For local development, swap that to `http://localhost:8000` (or, after F03 lands, set `VITE_API_URL=http://localhost:8000` and rebuild). The full list of outbound endpoints is in `ARCHITECTURE.md` §3.

## Auth notes

- Access token in `localStorage.JWT_AUTH_TOKEN`
- Refresh token in `localStorage.JWT_REFRESH_TOKEN`
- `AuthRoute` automatically exchanges a refresh token for a new access token on first mount.

## PWA

The app installs to the home screen on iOS / Android. Notifications are scheduled client-side via `utils/notifications.js`; they do **not** require a server-side push subscription today.
