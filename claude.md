# openIMIS — fe-biometric-verification

## Purpose

This frontend module provides a single **publicly accessible** page where a health-facility agent or kiosk can:

1. Open the device camera and show a live video preview.
2. Accept an insuree identifier (UUID).
3. Capture a still frame and send it as a base-64 JPEG to the biometric-verification backend module.
4. Display whether the person in front of the camera matches the face enrolled at registration time.

No login is required to reach this page.

---

## Repository layout

```
openimis-fe-biometric_verification_js/
├── src/
│   ├── index.js                   # Module entry-point & openIMIS contribution
│   └── pages/
│       └── BiometricVerifyPage.js # The single public page
├── rollup.config.js               # Build config (ESM + CJS outputs)
└── package.json                   # @openimis/fe-biometric-verification
```

---

## Technology stack

| Concern | Choice |
|---|---|
| UI framework | React 17 |
| Component library | Material-UI v4 (`@material-ui/core`, `@material-ui/styles`) |
| Styling | `makeStyles` (JSS) |
| API calls | `useGraphqlMutation` from `@openimis/fe-core` |
| i18n | `react-intl` v5 (via fe-core) |
| Build | Vite 5 (library mode) — outputs `dist/index.es.js` (ESM) and `dist/index.js` (CJS) |
| Runtime | Node ≥ 16, npm ≥ 8 |

All `@openimis/*`, `@material-ui/*`, and `react*` packages are **peer dependencies** and must not be bundled.

---

## openIMIS module pattern

`src/index.js` exports a factory function `BiometricVerificationModule(cfg)` that merges a default config object into the openIMIS plugin registry.

The only contribution used is:

```
core.UnauthenticatedRouter
```

This tells `openimis-fe-core`'s `App.js` to mount `BiometricVerifyPage` at `/biometric/verify` **without** requiring the user to be authenticated.

---

## Public route

| Path | Component | Auth required |
|---|---|---|
| `/biometric/verify` | `BiometricVerifyPage` | No |

---

## BiometricVerifyPage — behaviour

1. On mount, calls `navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })` and attaches the stream to a `<video>` element. The preview is mirrored (`transform: scaleX(-1)`) so it feels natural to the subject.
2. The user types (or a barcode scanner pastes) the insuree UUID into a text field.
3. On "Verify" click:
   - A hidden `<canvas>` (640 × 640 px) captures the current video frame, also mirrored so the stored image is non-mirrored.
   - The canvas is serialised to a base-64 JPEG (`quality 0.92`).
   - The GraphQL mutation below is fired via `useGraphqlMutation`.
4. The result panel shows one of three states: **verified** (green), **rejected** (red), or **error** (grey).

### GraphQL mutation

```graphql
mutation VerifyFace($uuid: String!, $frame: String!) {
  verifyFace(insureeUuid: $uuid, frameB64: $frame) {
    verified     # Boolean
    confidence   # Float — percentage (0–100)
    distance     # Float — raw similarity distance
    provider     # String — e.g. "deepface", "aws_rekognition"
    error        # String | null
  }
}
```

The mutation is resolved by **`openimis-be-biometric-verification_py`** (Python/Django backend module, mounted as a local volume in the Docker compose setup).

---

## Backend integration (context only)

The backend module lives at `../openimis-be-biometric-verification_py` relative to the compose file. It is included in the main `openimis-be_py` Django application as a local editable install. The compose service is named `backend` and is reachable from the frontend container at `http://backend/api/graphql`.

The backend is expected to:
- Store a reference face photo for each insuree at enrolment time.
- Accept the `verifyFace` mutation, decode the base-64 frame, run a face-matching algorithm, and return the structured response above.

---

## Development workflow

```bash
# Install dev deps (peer deps come from the host app)
npm install

# Watch & rebuild on change  (vite build --watch)
npm start

# Production build  (vite build)
npm run build
```

The build is configured in `vite.config.js` using Vite's **library mode**.
`@vitejs/plugin-react` handles JSX transformation via esbuild — no Babel config is needed.
All peer dependencies are declared as Rollup externals inside the Vite config so they are never bundled.

The built artefacts land in `dist/`. To use the module inside `openimis-fe_js`, add it to `package.json` as a local path dependency and register `BiometricVerificationModule` in the openIMIS configuration JSON.

---

## Key design constraints

- **No authentication** — the route must be reachable without a valid session token so it can run on a public kiosk.
- **No navigation chrome** — the page is self-contained; do not add the standard openIMIS sidebar/header.
- **Minimal dependencies** — only peer deps already shipped with `openimis-fe_js` should be used.
- **Camera cleanup** — the `useEffect` must stop all media tracks on unmount to avoid leaving the camera LED on.
- **Image orientation** — the canvas draw step un-mirrors the preview so the JPEG sent to the backend matches the orientation of the enrolled photo.
