# openIMIS Frontend Biometric Verification Module

## Overview

This module provides a **publicly accessible** biometric face verification page for openIMIS. It allows health facility agents or kiosks to verify beneficiary identity in real-time using facial recognition, without requiring user authentication.

## Features

- 🎥 Live camera preview with automatic frame capture
- 🤖 **Client-side face detection** with quality checks (TinyFaceDetector)
  - Real-time face presence detection
  - Position guidance (centered, move left/right/up/down)
  - Distance guidance (move closer/back)
  - Lighting quality feedback (too dark warning)
  - **Smart streaming**: Frames only sent to backend when all quality checks pass
  - Visual "Ready to Verify" indicator when quality is optimal
- 🔐 Face verification against enrolled reference photos
- 📱 Responsive design (mobile and desktop)
- 🚫 **No login required** - fully public access

## Public URL

### Access the verification page

```
https://your-domain.com/front/biometric/verify
```

## Usage Workflow

1. **Open the page** at the public URL
2. **Allow camera access** when prompted by the browser
3. **Enter or scan the insuree UUID** (or use a pre-filled URL)
4. **Position your face** - Real-time quality indicators guide you:
   - Face detection status
   - Position alignment (centered/move left/right/up/down)
   - Distance check (move closer/back)
   - Lighting quality (too dark warning)
5. **Click "Start Verification"** to begin streaming verification
6. **View results** - The system displays:
   - ✅ **Verified** (green) - Identity confirmed
   - ❌ **Not Verified** (red) - Identity mismatch
   - ⚠️ **Error** (grey) - Technical issue
7. **Stop verification** when done

The system continuously streams video frames via WebSocket, but only sends frames to the backend when all quality checks pass (face detected, centered, good distance, sufficient lighting). This smart streaming approach reduces bandwidth and improves verification accuracy.

## Integration

### In openimis-fe_js

Add this module to `openimis.json` or `openimis-dev.json`:

```json
{
  "name": "BiometricVerificationModule",
  "npm": "@openimis/fe-biometric-verification@file:/path/to/openimis-fe-biometric_verification_js"
}
```

### Docker Compose Setup

Mount the module as a volume in `compose.base.yml`:

```yaml
services:
  frontend:
    volumes:
      - ../openimis-fe-biometric_verification_js:/frontend-packages/openimis-fe-biometric_verification_js
```

### Backend Requirement

This module requires the **openimis-be-biometric-verification** Python backend module to be installed and configured. See the backend module documentation for setup instructions.

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Watch mode (auto-rebuild on changes)
npm start
```

### Face Detection Models Setup

This module uses **TinyFaceDetector** from `@vladmandic/face-api` for client-side face quality checks.

#### Model Loading

The BiometricVerifyPage component automatically loads the models from the **vladmandic CDN** on mount:

```javascript
const MODEL_URL = "https://vladmandic.github.io/face-api/model";
```

**Advantages of CDN approach:**
- ✅ No local files needed - fully portable module
- ✅ Always up-to-date models
- ✅ No CORS issues
- ✅ Cached by browsers across sites

Check the browser console for:
```
✓ TinyFaceDetector models loaded from CDN
```

#### Alternative: Self-hosted Models (Production)

For production environments where external dependencies are not allowed, you can self-host the models:

1. Download model files:
```bash
cd /path/to/your-cdn-directory
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-weights_manifest.json
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model.bin
```

2. Update `MODEL_URL` in `BiometricVerifyPage.jsx`:
```javascript
const MODEL_URL = "https://your-cdn.example.com/models";
```

**Model files required:**
- `tiny_face_detector_model-weights_manifest.json` (3KB)
- `tiny_face_detector_model.bin` (189KB)

Total size: ~192KB (very lightweight!)

## Technology Stack

- **React 18** - UI framework
- **Material-UI v7** - Component library
- **@mui/styles** - Styling (makeStyles)
- **Vite 5** - Build tool
- **WebRTC** - Camera access via `navigator.mediaDevices.getUserMedia`
- **@vladmandic/face-api** - Client-side face detection (TinyFaceDetector)
- **WebSocket** - Real-time streaming communication with backend

## WebSocket Protocol

The page establishes a WebSocket connection to `/api/ws/biometric/verify/` for real-time verification:

### Client → Server (Frame Submission)
```json
{
  "type": "frame",
  "insuree_uuid": "uuid-string",
  "frame": "data:image/jpeg;base64,...",
  "claim_code": "optional-claim-code",
  "step_name": "verification",
  "device_id": "browser-user-agent"
}
```

### Server → Client (Verification Result)
```json
{
  "type": "verification_result",
  "verified": true,
  "confidence": 85.5,
  "distance": 0.35,
  "provider": "deepface",
  "error": null,
  "verification_count": 3,
  "frame_count": 15,
  "audit_uuid": "audit-record-uuid"
}
```

**Backend Sampling:** The backend processes frames every 5 seconds (configurable) to reduce CPU load, even though the frontend sends frames continuously when quality is good.

## Security Considerations

This page is **publicly accessible** by design (no authentication required). The backend module implements:

- Anonymous access whitelisting for `verifyFace` mutation
- Optional permission checks for authenticated users
- Rate limiting recommendations (configure at infrastructure level)

See `SECURITY.md` in the backend module for detailed security guidance.

## Browser Compatibility

- **Chrome/Edge** 90+ ✅
- **Firefox** 88+ ✅
- **Safari** 14+ ✅
- **Mobile browsers** with camera access ✅

**Note:** Camera access requires **HTTPS** in production (localhost works with HTTP for development).

## Troubleshooting

### Camera not working
- Ensure the browser has permission to access the camera
- Check that the site is served over HTTPS (required for camera access in production)
- Verify no other application is using the camera

### "Insuree not found" error
- Confirm the UUID is correct
- Verify the insuree exists in the database
- Check that a reference photo was uploaded during enrollment

### Backend connection issues
- Verify the backend module is installed and running
- Check GraphQL endpoint is accessible at `/api/graphql`
- Review backend logs for errors

## License

LGPL-3.0

## Support

For issues and questions, please refer to the main openIMIS documentation
