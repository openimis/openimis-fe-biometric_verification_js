# openIMIS Frontend Biometric Verification Module

## Overview

This module provides a **publicly accessible** biometric face verification page for openIMIS. It allows health facility agents or kiosks to verify beneficiary identity in real-time using facial recognition, without requiring user authentication.

## Features

- 🎥 Live camera preview with automatic frame capture
- 🔐 Face verification against enrolled reference photos
- ⏰ Automatic periodic verification (every 15 seconds)
- 🎨 Modern two-column layout with openIMIS branding
- 📱 Responsive design (mobile and desktop)
- 🚫 **No login required** - fully public access

## Public URL

### Access the verification page

```
https://your-domain.com/front/biometric/verify
```

### With pre-filled insuree UUID (for QR codes or deep links)

```
https://your-domain.com/front/biometric/verify/{insuree-uuid}
```

**Example:**
```
https://your-domain.com/front/biometric/verify/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

When a UUID is provided in the URL, the insuree UUID field is automatically pre-filled, making it ideal for:
- QR code workflows
- Deep linking from enrollment systems
- Kiosk integrations with barcode scanners

## Usage Workflow

1. **Open the page** at the public URL
2. **Allow camera access** when prompted by the browser
3. **Enter or scan the insuree UUID** (or use a pre-filled URL)
4. **Click "Start Verification"** to begin automatic verification
5. **View results** - The system displays:
   - ✅ **Verified** (green) - Identity confirmed
   - ❌ **Not Verified** (red) - Identity mismatch
   - ⚠️ **Error** (grey) - Technical issue
6. **Stop verification** when done

The system automatically captures and verifies frames every 15 seconds while verification is active.

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

## Technology Stack

- **React 18** - UI framework
- **Material-UI v7** - Component library
- **@mui/styles** - Styling (makeStyles)
- **Vite 5** - Build tool
- **WebRTC** - Camera access via `navigator.mediaDevices.getUserMedia`
- **GraphQL** - Backend communication

## GraphQL Mutation

The page calls the `verifyFace` mutation:

```graphql
mutation VerifyFace($input: VerifyFaceInput!) {
  verifyFace(input: $input) {
    verified
    confidence
    distance
    provider
    error
  }
}
```

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

For issues and questions, please refer to the main openIMIS documentation or contact your system administrator.
