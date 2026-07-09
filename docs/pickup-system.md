# Runner Pickup QR Frontend

This document describes the static frontend added for runner pickup pass verification.

## Scope

This is frontend-only work. The backend endpoints, Firestore writes, Firebase Cloud Functions, Google Sheets automations, QR campaign generation, and email delivery are not implemented in this repository.

No emails are sent by this frontend. No `RUNNER_PICKUP_PASS` email flow is implemented here.

## Files Added

- `admin/pickup/index.html`
- `p/index.html`
- `src/pickup-admin.js`
- `src/pickup-pass.js`
- `src/pickup-api.js`
- `src/pickup-auth.js`
- `src/pickup-config.js`
- `src/pickup.css`
- `docs/pickup-system.md`

## Pages

- Admin scanner: `https://abrazojunelly.org/admin/pickup/`
- Public pass page: `https://abrazojunelly.org/p/?t=TOKEN`

The routes use folder-based `index.html` files so they work on GitHub Pages without a server-side router.

## Firebase Web Auth Configuration

Edit `src/pickup-config.js` and fill `PICKUP_FIREBASE_CONFIG` with the public Firebase Web app config:

```js
export const PICKUP_FIREBASE_CONFIG = {
  apiKey: "PUBLIC_WEB_API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  appId: "PUBLIC_WEB_APP_ID",
};
```

Firebase Web config is public client configuration. Do not place service account keys, private keys, dashboard secrets, API secrets, or Firebase Admin SDK credentials in this file.

## Firebase Authentication Setup

In Firebase Console:

1. Go to Authentication.
2. Enable Google as a sign-in provider.
3. Add the production domain to Authorized domains:
   - `abrazojunelly.org`
4. Add any local HTTPS testing domain you intentionally use.

The frontend performs a visual allow-list check for:

- `janjannunez777@gmail.com`
- `cqvkiki@gmail.com`

This frontend check is not final authorization. The backend must verify the Firebase ID token and enforce the same authorization server-side.

Administrative API calls use the cached Firebase ID token by default. If an administrative request returns HTTP 401, the frontend explicitly requests one fresh ID token and retries the request once. There are no retry loops.

## API URL Configuration

Set these values in `src/pickup-config.js` after the backend is deployed:

```js
export const PICKUP_PUBLIC_LOOKUP_URL = "https://...";
export const PICKUP_PUBLIC_QR_IMAGE_URL = "https://...";
export const PICKUP_ADMIN_LOOKUP_URL = "https://...";
export const PICKUP_ADMIN_CONFIRM_URL = "https://...";
export const PICKUP_ADMIN_SEARCH_URL = "https://...";
```

Leave them empty until the real backend endpoints exist. The frontend will show readable configuration or connection errors instead of silently falling back to production-like mock data.

## Admin API Contracts

### Verify QR

Request:

```http
POST PICKUP_ADMIN_LOOKUP_URL
Authorization: Bearer FIREBASE_ID_TOKEN
Content-Type: application/json
Accept: application/json
```

```json
{
  "token": "TOKEN_EXTRAIDO"
}
```

Valid pass:

```json
{
  "ok": true,
  "status": "VALID",
  "runner": {
    "runnerNumber": 136,
    "fullName": "Ivan Lopez Chaparro",
    "phoneLast4": "3018",
    "pickupCode": "J136-AF2A8",
    "numberPickedUp": false,
    "numberPickedUpAt": null
  }
}
```

Already picked up:

```json
{
  "ok": true,
  "status": "ALREADY_PICKED_UP",
  "runner": {
    "runnerNumber": 136,
    "fullName": "Ivan Lopez Chaparro",
    "phoneLast4": "3018",
    "pickupCode": "J136-AF2A8",
    "numberPickedUp": true,
    "numberPickedUpAt": "2026-07-12T10:42:00.000Z",
    "numberPickedUpBy": "janjannunez777@gmail.com"
  }
}
```

Invalid token:

```json
{
  "ok": false,
  "status": "INVALID_TOKEN",
  "error": "INVALID_TOKEN"
}
```

### Confirm QR Pickup

Request:

```http
POST PICKUP_ADMIN_CONFIRM_URL
Authorization: Bearer FIREBASE_ID_TOKEN
Content-Type: application/json
Accept: application/json
```

```json
{
  "token": "TOKEN_EXTRAIDO"
}
```

Success:

```json
{
  "ok": true,
  "status": "PICKUP_CONFIRMED",
  "runner": {
    "runnerNumber": 136,
    "fullName": "Ivan Lopez Chaparro",
    "phoneLast4": "3018",
    "pickupCode": "J136-AF2A8",
    "numberPickedUp": true,
    "numberPickedUpAt": "2026-07-12T10:42:00.000Z",
    "numberPickedUpBy": "janjannunez777@gmail.com"
  }
}
```

### Manual Search

Request:

```http
POST PICKUP_ADMIN_SEARCH_URL
Authorization: Bearer FIREBASE_ID_TOKEN
Content-Type: application/json
Accept: application/json
```

```json
{
  "query": "texto escrito"
}
```

Response:

```json
{
  "ok": true,
  "results": [
    {
      "registrationId": "reg_sheet-row-123",
      "runnerNumber": 136,
      "fullName": "Ivan Lopez Chaparro",
      "phoneLast4": "3018",
      "pickupCode": "J136-AF2A8",
      "numberPickedUp": false,
      "numberPickedUpAt": null
    }
  ]
}
```

Manual confirmation is centralized in `src/pickup-api.js`. The current configurable strategy is:

```js
export const PICKUP_MANUAL_CONFIRM_STRATEGY = "registrationId";
```

It can be changed later to `runnerNumber` if the backend contract chooses that shape.

## Public Pass API Contract

Request:

```http
GET PICKUP_PUBLIC_LOOKUP_URL?t=TOKEN&source=email
Accept: application/json
```

Allowed tracking sources are `email`, `qr`, and `direct`. If the public page receives no `src` parameter, or an unsupported value, it sends `direct`. Invalid tokens are rejected before the lookup call, so no visit is registered for invalid token shapes.

Valid response:

```json
{
  "ok": true,
  "status": "VALID",
  "pass": {
    "runners": [
      {
        "runnerNumber": 136,
        "displayName": "Ivan L.",
        "pickupCode": "J136-AF2A8",
        "numberPickedUp": false
      }
    ]
  }
}
```

Legacy individual response shape is also supported:

```json
{
  "ok": true,
  "status": "VALID",
  "pass": {
    "runnerNumber": 136,
    "displayName": "Ivan L.",
    "pickupCode": "J136-AF2A8",
    "numberPickedUp": false
  }
}
```

The public page never confirms pickup and never shows private fields.

The QR image is loaded from the project endpoint, not from an external QR generation service:

```http
GET PICKUP_PUBLIC_QR_IMAGE_URL?t=TOKEN&src=qr
```

## QR Library

The admin page uses `html5-qrcode@2.3.8` from a fixed CDN URL:

```html
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
```

It is loaded directly in the browser to keep the static site free of a bundler.

The scanner uses `pause(true)` and `resume()` while a QR result is being verified or confirmed, so the camera can stay warm without repeatedly asking for permission. If pause/resume is unavailable or fails, the UI falls back to stop/start.

## Token Handling

The scanner accepts:

- Full URLs such as `https://abrazojunelly.org/p/?t=TOKEN`
- Raw token text pasted manually

The frontend extracts only the `t` parameter, validates length and base64url-style characters, and sends only the token to the backend. Tokens are not stored in `localStorage`, `sessionStorage`, or IndexedDB. Tokens are not printed to logs.

## Mock Mode

Mock mode exists only for local frontend testing and is disabled by default:

```js
export const PICKUP_MOCK_MODE = false;
```

To test without backend, explicitly set it to `true` in `src/pickup-config.js`. The UI displays a large `MODO DE PRUEBA` warning and uses fictitious names only.

Do not enable mock mode for production.

## Camera Testing

Camera access requires HTTPS in most browsers. Test on:

- `https://abrazojunelly.org/admin/pickup/` after deployment
- A local HTTPS server if testing before deployment

Chrome mobile and Safari mobile should prompt for camera permission. The UI includes a manual token field for devices without camera support.

## Desktop Testing Without Camera

Use the manual token input on the admin page. Paste either a full pass URL or a raw token that matches the configured token rules.

With mock mode enabled, sample raw tokens can be tested:

- `mock_valid_runner_136`
- `mock_picked_runner_136`
- `mock_invalid_runner_136`

## Secret Check

Before shipping, verify:

- No `DASHBOARD_API_SECRET` exists in frontend files.
- No service account JSON exists in the repository.
- No private key exists in the repository.
- No Firebase Admin SDK is imported.
- No backend source or Firestore credentials are added.
- No real participant private data is committed.

Suggested command:

```powershell
rg -n "DASHBOARD_API_SECRET|service_account|private_key|firebase-admin|RUNNER_PICKUP_PASS|sendEmail|emailSecret" .
```

## Manual Test Checklist

1. Unauthenticated user sees login.
2. Unauthorized Google account is signed out and sees `Esta cuenta no esta autorizada`.
3. `janjannunez777@gmail.com` can sign in after Firebase is configured.
4. `cqvkiki@gmail.com` can sign in after Firebase is configured.
5. Session remains after reload through Firebase local persistence.
6. QR reader requests camera permission.
7. Scanner can stop and resume.
8. Valid QR URL extracts `t`.
9. Invalid token is rejected before backend call.
10. Repeated QR does not trigger continuous calls.
11. Valid pass shows runner number and name.
12. Already picked up state is visually distinct.
13. Confirm pickup requires a second tap.
14. After confirming pickup, UI returns to scanner.
15. Network/CORS error shows a readable message.
16. Manual search handles multiple results.
17. Public pass page does not show private data.
18. Frontend contains no secrets.
19. Existing progress and donation pages still load.
20. No email is sent.
21. A confirmation response with `ok: true` and `status: "PICKUP_CONFIRMED"` shows the success state.
22. A confirmation response with `ok: false` shows an error and does not clear the current QR token.
23. A confirmation response with `status: "INVALID_TOKEN"` shows an error and never shows `Numero entregado`.
24. An administrative HTTP 401 triggers exactly one fresh-token retry.
25. Scanner pause/resume returns to scanning without a new camera permission prompt.
26. Scanner stop/start fallback still works if pause/resume fails.
27. The Google sign-in button is disabled before the auth controller finishes initializing.

## Explicit Restrictions

- Backend is not implemented in this frontend repository.
- Firebase Functions are not deployed from this work.
- Firestore is not accessed directly from the browser.
- Emails are not sent.
- QR pass generation and email campaigns are not implemented.
- This frontend only prepares the mobile admin flow and public pass view for future backend integration.
