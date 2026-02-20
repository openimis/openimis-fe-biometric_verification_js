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
│   ├── index.js                    # Module entry-point & openIMIS contribution
│   └── pages/
│       └── BiometricVerifyPage.jsx # The single public page (must be .jsx for esbuild)
├── vite.config.js                  # Build config (ESM + CJS outputs, library mode)
└── package.json                    # @openimis/fe-biometric-verification
```

> **Important:** the page component must keep the `.jsx` extension. Vite/esbuild only enables JSX
> parsing for files with `.jsx` (or `.tsx`) extensions — using `.js` causes a parse error at build time.

---

## Technology stack

| Concern | Choice |
|---|---|
| UI framework | React 18 |
| Component library | MUI v7 (`@mui/material`) + legacy JSS (`@mui/styles`) |
| Styling | `makeStyles` from `@mui/styles` |
| API calls | `useGraphqlMutation` from `@openimis/fe-core` |
| i18n | `react-intl` v6 (via fe-core) |
| Build | Vite 5 (library mode) — outputs `dist/index.es.js` (ESM) and `dist/index.js` (CJS) |
| Runtime | Node ≥ 16, npm ≥ 8 |

All `@openimis/*`, `@mui/*`, and `react*` packages are **peer dependencies** and must not be bundled.

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
| `/biometric/verify/:uuid?` | `BiometricVerifyPage` | No |

The `:uuid` parameter is optional. When provided (e.g. `/front/biometric/verify/abc-123-def`), the insuree UUID field is pre-filled. This enables QR-code or deep-link workflows where the kiosk receives a direct URL with the insuree identifier embedded.

---

## BiometricVerifyPage — behaviour

### Page layout

The page uses a **two-column layout**:

- **Left panel** (dark teal `#006273`): Explanatory section describing the purpose of the verification system — confirms beneficiary identity and liveness to ensure they can receive their benefit package. Includes the openIMIS logo (white-filtered) and feature icons.
- **Right panel** (white): Camera preview, insuree UUID input field (pre-filled from URL if available), and verification controls.

### Verification workflow

1. **On mount**: Calls `navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })` and attaches the stream to a `<video>` element. The preview is mirrored (`transform: scaleX(-1)`) so it feels natural to the subject.
2. **Pre-fill UUID**: If a `:uuid` parameter is present in the URL, the insuree UUID field is automatically pre-filled. Otherwise, the user types (or a barcode scanner pastes) the insuree UUID.
3. **Start verification** (button click):
   - **Immediate first capture**: A hidden `<canvas>` (640 × 640 px) captures the current video frame (mirrored), serialises it to base-64 JPEG (`quality 0.92`), and sends it via the GraphQL mutation.
   - **Auto-repeat every 15 seconds**: A `setInterval` fires every 15 seconds, capturing and sending a new frame automatically.
   - The UUID input is **disabled** during verification to prevent changes mid-session.
   - A **"Stop Verification"** button (red) appears, allowing the user to halt the periodic captures.
4. **Results**: Each verification displays one of three states:
   - **Verified** (green border + light green background + CheckCircle icon)
   - **Rejected** (red border + light red background + Cancel icon)
   - **Error** (grey border + white background + Cancel icon)
   - The total number of captures is displayed in the result panel.

### Visual design

The page uses **openIMIS branding** and follows the standard color palette:

- **Page background**: `#dbeef0` (light teal — openIMIS `backgroundColor`)
- **Left panel background**: `#006273` (dark teal — openIMIS `primaryColor`)
- **Primary**: `#006273` — used for buttons, camera border, titles
- **Error**: `#801a00` (openIMIS `errorColor`) — used for "Stop" button
- **Text**: `#003d4a` (dark blue — openIMIS `fontColor`)
- **Borders/inputs**: `#b7d4d8` (medium teal — openIMIS `headerColor`)
- **Font**: Rubik / Roboto (matches openIMIS typography)

The **openIMIS logo** is displayed in the left panel (white-filtered). Material-UI icons (`CheckCircleIcon`, `CancelIcon`, `VerifiedUserIcon`) illustrate features and results.

### GraphQL mutation

```graphql
mutation VerifyFace($input: VerifyFaceInput!) {
  verifyFace(input: $input) {
    verified     # Boolean
    confidence   # Float — percentage (0–100)
    distance     # Float — raw similarity distance
    provider     # String — e.g. "deepface", "aws_rekognition"
    error        # String | null
  }
}
```

**Input type:**
```graphql
input VerifyFaceInput {
  clientMutationId: String  # Optional - accepted in camelCase for useGraphqlMutation compatibility
  client_mutation_id: String  # Optional - accepted in snake_case for openIMIS convention
  uuid: String!  # Insuree UUID
  frame: String!  # Base64-encoded JPEG
}
```

The backend accepts **both** `clientMutationId` (camelCase) and `client_mutation_id` (snake_case) to support `useGraphqlMutation`'s automatic field injection while maintaining openIMIS conventions. The mutation is resolved by **`openimis-be-biometric-verification_py`** (Python/Django backend module, mounted as a local volume in the Docker compose setup).

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

The built artefacts land in `dist/`. To use the module inside `openimis-fe_js`, add it to `openimis.json` as a local path dependency (`file:` reference) and register `BiometricVerificationModule` in the openIMIS module list.

---

## Integration into openimis-fe_js (dev container)

In `openimis-dev.json` (inside `openimis-fe_js`), add an entry that points to this module's source directory:

```json
{
  "name": "BiometricVerificationModule",
  "npm": "@openimis/fe-biometric-verification@file:/path/to/openimis-fe-biometric_verification_js"
}
```

`entrypoint-dev.js` rewrites `openimis-dev.json` with `file:` references for all cloned/local modules. `openimis-config-vite.js` reads the rewritten JSON and injects Vite `resolve.alias` entries pointing into the `src/` directory of each `file:` module, enabling hot-reload of sources without a prior `npm run build`.

---

## Key design constraints

- **No authentication** — the route must be reachable without a valid session token so it can run on a public kiosk.
- **No navigation chrome** — the page is self-contained; do not add the standard openIMIS sidebar/header.
- **Minimal dependencies** — only peer deps already shipped with `openimis-fe_js` should be used.
- **Camera cleanup** — the `useEffect` must stop all media tracks on unmount to avoid leaving the camera LED on.
- **Image orientation** — the canvas draw step un-mirrors the preview so the JPEG sent to the backend matches the orientation of the enrolled photo.
- **`.jsx` extension** — always use `.jsx` (not `.js`) for files that contain JSX syntax. esbuild does not parse JSX in `.js` files.
