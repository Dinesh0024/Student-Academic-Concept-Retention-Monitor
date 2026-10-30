# Academic Portal

## Database configuration

For local development, run `npm run dev`. If `MONGODB_URI` is not set, the app stores API data in `server/database.json`; `/api/health` reports `database: "local-json"`. This mode uses the existing local data file and does not require MongoDB.

For persistent cloud data, configure `MONGODB_URI` and optionally `MONGODB_DB` (defaults to `academic`). Run `npm run db:check` to verify CRUD against the active store (local JSON or MongoDB). Keep connection strings private; `.env` is ignored by Git.

## Student account access

Students cannot self-register. Faculty can create student accounts from the **Students** section in the faculty dashboard by entering the student's name, email, enrollment number, department, semester, and a temporary password (at least 8 characters). Share the credentials with the student securely; the student can then sign in with that email and password. Faculty can also edit student profiles or revoke access from the directory.

Deployment note: `render.yaml` currently provisions PostgreSQL as `DATABASE_URL`, but the collection API does not use that variable. Set `MONGODB_URI` in the hosting service to use MongoDB in production. Without it, the JSON file is local to the app instance and is not suitable for durable production storage. The older SQL-style auth routes still use the JSON store.

## Two-factor authentication

Users can enable authenticator-app TOTP in **Settings**. Setup requires the account password and confirmation of a six-digit code before enrollment is activated. Password sign-in then returns a short-lived challenge instead of a session token; the backend issues the normal session token only after the authenticator code is verified. Disabling 2FA also requires the account password and a valid code. Google sign-in and faculty passkey sign-in continue to use their separate provider/passkey authentication flows.

Set a stable, private `MFA_ENCRYPTION_KEY` in each deployment to encrypt stored TOTP secrets at rest. If omitted, the app derives the encryption key from `JWT_SECRET`; changing either key will make existing authenticator secrets unreadable, requiring users to enroll again. Keep both values private and configure strong random values in production.

## Development

This project uses Vite, React, and Express. Run `npm run dev` to serve the frontend and API together.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
