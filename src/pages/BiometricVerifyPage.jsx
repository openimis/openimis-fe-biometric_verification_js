import { useRef, useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { makeStyles } from "@mui/styles";
import { Button, CircularProgress, TextField, Typography, Box, Grid } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WarningIcon from "@mui/icons-material/Warning";
import * as faceapi from "@vladmandic/face-api";

const theme = createTheme();

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "100vh",
    background: "#dbeef0", // openIMIS backgroundColor
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  wrapper: {
    maxWidth: 1200,
    width: "100%",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0, 98, 115, 0.15)",
    overflow: "hidden",
    display: "block", // Ensure Grid can flex properly inside
  },
  leftPanel: {
    background: "#006273", // openIMIS primaryColor
    color: "#fff",
    padding: 48,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: 600,
    width: "100%",
    "@media (min-width: 900px)": {
      width: "41.666667%", // 5/12 columns
      maxWidth: "41.666667%",
      flexBasis: "41.666667%",
    },
  },
  logo: {
    marginBottom: 32,
    height: "150px",
    width: "170px",
    filter: "brightness(0) invert(1)", // Make logo white
  },
  leftTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: 24,
    fontFamily: "Rubik, Roboto, sans-serif",
  },
  leftText: {
    fontSize: "1rem",
    lineHeight: 1.8,
    marginBottom: 16,
    opacity: 0.95,
  },
  iconFeature: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    fontSize: "1rem",
  },
  rightPanel: {
    padding: 48,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 600,
    width: "100%",
    "@media (min-width: 900px)": {
      width: "58.333333%", // 7/12 columns
      maxWidth: "58.333333%",
      flexBasis: "58.333333%",
    },
  },
  title: {
    color: "#006273", // openIMIS primaryColor
    fontWeight: 600,
    fontSize: "1.5rem",
    marginBottom: 32,
    textAlign: "center",
  },
  cameraWrap: {
    width: 320,
    height: 320,
    borderRadius: "50%",
    overflow: "hidden",
    border: "4px solid #006273", // openIMIS primaryColor
    background: "#f5f5f5",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(0, 98, 115, 0.2)",
    marginBottom: 24,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)", // mirror preview
  },
  input: {
    width: "100%",
    marginBottom: 16,
    "& .MuiInputBase-root": { background: "#fff", color: "#003d4a" },
    "& .MuiInputLabel-root": { color: "#006273" },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#b7d4d8" },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#006273",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#006273",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#006273",
    },
  },
  buttonGroup: {
    display: "flex",
    gap: 12,
    width: "100%",
    marginBottom: 24,
  },
  button: {
    flex: 1,
    background: "#006273", // openIMIS primaryColor
    color: "#fff",
    fontWeight: 600,
    padding: "12px 24px",
    "&:hover": { background: "#004d5a" },
    "&:disabled": { background: "#b7d4d8", color: "#fff" },
  },
  stopButton: {
    flex: 1,
    background: "#801a00", // openIMIS errorColor
    color: "#fff",
    fontWeight: 600,
    padding: "12px 24px",
    "&:hover": { background: "#5a1200" },
  },
  result: {
    width: "100%",
    padding: 20,
    borderRadius: 8,
    textAlign: "center",
  },
  verified: {
    background: "#d1f4dd",
    color: "#0d7a2c",
    border: "2px solid #0d7a2c",
  },
  rejected: {
    background: "#ffd6d6",
    color: "#801a00", // openIMIS errorColor
    border: "2px solid #801a00",
  },
  error: {
    background: "#fff",
    color: "#666",
    border: "2px solid #ccc",
  },
  detail: {
    fontSize: "0.85rem",
    marginTop: 8,
    opacity: 0.85,
  },
  status: {
    fontSize: "0.9rem",
    color: "#006273",
    marginTop: 16,
    fontWeight: 500,
  },
  connectionStatus: {
    fontSize: "0.75rem",
    padding: "4px 12px",
    borderRadius: 12,
    fontWeight: 500,
    marginBottom: 16,
  },
  connected: {
    background: "#d1f4dd",
    color: "#0d7a2c",
  },
  disconnected: {
    background: "#ffd6d6",
    color: "#801a00",
  },
  connecting: {
    background: "#fff4e5",
    color: "#e65100",
  },
  qualityIndicators: {
    width: "100%",
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  columnsContainer: {
    width: "100%",
    marginTop: 16,
    minHeight: 220,
    marginBottom: 20,
  },
  gridContainer2:{
    width: "45%"
  },
  columnBox: {
    display: "flex",
    flexDirection: "column",
    minHeight: 220,
    padding: 12,
    border: "1px solid #b7d4d8",
    borderRadius: 8,
    background: "#fff",
  },
  sectionTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#006273",
    marginBottom: 12,
    textAlign: "center",
  },
  qualityItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  qualityGood: {
    background: "#d1f4dd",
    color: "#0d7a2c",
  },
  qualityWarning: {
    background: "#fff4e5",
    color: "#e65100",
  },
  qualityBad: {
    background: "#ffd6d6",
    color: "#801a00",
  },
  readyIndicator: {
    width: "100%",
    maxWidth: 400,
    padding: "12px 16px",
    borderRadius: 8,
    fontSize: "0.95rem",
    fontWeight: 600,
    textAlign: "center",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ready: {
    background: "#d1f4dd",
    color: "#0d7a2c",
    border: "2px solid #0d7a2c",
  },
  notReady: {
    background: "#fff4e5",
    color: "#e65100",
    border: "2px solid #e65100",
  },
}));

// WebSocket URL - adjust based on your deployment
const getWebSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname;
  const port = window.location.port || (protocol === "wss:" ? "443" : "80");
  return `${protocol}//${host}:${port}/api/ws/biometric/verify/`;
};

const BiometricVerifyPage = () => {
  const classes = useStyles();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const { uuid } = useParams(); // Read insuree UUID from URL parameter
  const location = useLocation();

  // Extract query parameters using URLSearchParams (React Router v5)
  const searchParams = new URLSearchParams(location.search);
  const claimCodeFromUrl = searchParams.get("claimCode") || "";

  const [insureeUuid, setInsureeUuid] = useState(uuid || "");
  const [claimCode, setClaimCode] = useState(claimCodeFromUrl);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [result, setResult] = useState(null); // { verified, confidence, distance, provider, error }
  const [isVerifying, setIsVerifying] = useState(false); // Auto-verify in progress
  const [verificationCount, setVerificationCount] = useState(0);
  const [framesSent, setFramesSent] = useState(0); // Frames actually sent to backend
  const [framesSkippedQuality, setFramesSkippedQuality] = useState(0); // Skipped due to poor quality
  const [wsStatus, setWsStatus] = useState("disconnected"); // "disconnected" | "connecting" | "connected"

  // Face detection state
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceQuality, setFaceQuality] = useState({
    position: null, // "centered" | "left" | "right" | "top" | "bottom"
    distance: null, // "good" | "too_close" | "too_far"
    brightness: null, // "good" | "too_dark"
  });
  const detectionIntervalRef = useRef(null);

  // ── Load Face-API Models ───────────────────────────────────────────────
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Use CDN for model files - more portable and no need for local files
        const MODEL_URL = "https://vladmandic.github.io/face-api/model";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        console.log("TinyFaceDetector models loaded from CDN");
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        setCameraError("Failed to load face detection models");
      }
    };
    loadModels();
  }, []);

  // ── Camera ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let stream = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => setCameraReady(true);
        }
      })
      .catch((err) => setCameraError("Camera error: " + err.message));

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Face Detection Loop ────────────────────────────────────────────────
  useEffect(() => {
    if (!modelsLoaded || !cameraReady || !videoRef.current) {
      return;
    }

    const detectFace = async () => {
      try {
        const video = videoRef.current;
        if (!video || video.readyState !== 4) {
          return;
        }

        // Detect face with TinyFaceDetector
        const detection = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );

        if (detection) {
          setFaceDetected(true);

          // Analyze face quality
          const box = detection.box;
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          // Position analysis
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;
          const videoCenterX = videoWidth / 2;
          const videoCenterY = videoHeight / 2;

          const offsetX = Math.abs(centerX - videoCenterX) / videoWidth;
          const offsetY = Math.abs(centerY - videoCenterY) / videoHeight;

          let position = "centered";
          if (offsetX > 0.25) position = centerX < videoCenterX ? "left" : "right";
          else if (offsetY > 0.2) position = centerY < videoCenterY ? "top" : "bottom";

          // Distance analysis (based on face box size relative to frame)
          const faceArea = box.width * box.height;
          const videoArea = videoWidth * videoHeight;
          const faceRatio = faceArea / videoArea;

          let distance = "good";
          if (faceRatio > 0.4) distance = "too_close";
          else if (faceRatio < 0.08) distance = "too_far";

          // Brightness analysis (sample pixels from face region)
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(
            (box.x / videoWidth) * canvas.width,
            (box.y / videoHeight) * canvas.height,
            (box.width / videoWidth) * canvas.width,
            (box.height / videoHeight) * canvas.height
          );

          let totalBrightness = 0;
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            totalBrightness += (r + g + b) / 3;
          }
          const avgBrightness = totalBrightness / (imageData.data.length / 4);

          let brightness = "good";
          if (avgBrightness < 60) brightness = "too_dark";

          setFaceQuality({ position, distance, brightness });
        } else {
          setFaceDetected(false);
          setFaceQuality({ position: null, distance: null, brightness: null });
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    };

    // Run detection every 500ms
    detectionIntervalRef.current = setInterval(detectFace, 500);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [modelsLoaded, cameraReady]);

  // ── WebSocket Connection ───────────────────────────────────────────────
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setWsStatus("connecting");
    const ws = new WebSocket(getWebSocketUrl());

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message:", data);

        if (data.type === "connected") {
          console.log(`Connected - sampling interval: ${data.sampling_interval}s`);
        } else if (data.type === "verification_result") {
          // Update result
          setResult({
            verified: data.verified,
            confidence: data.confidence,
            distance: data.distance,
            provider: data.provider,
            error: data.error,
          });
          setVerificationCount(data.verification_count || 0);
        } else if (data.type === "error") {
          console.error("WebSocket error:", data.message);
          setResult({ verified: false, error: data.message });
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsStatus("disconnected");
      setCameraError("WebSocket connection error");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWsStatus("disconnected");
      stopStreaming();
    };

    wsRef.current = ws;
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsStatus("disconnected");
  };

  // ── Check if face quality is good enough to send frame ────────────────
  const isFaceQualityGood = () => {
    return (
      faceDetected &&
      faceQuality.position === "centered" &&
      faceQuality.distance === "good" &&
      faceQuality.brightness === "good"
    );
  };

  // ── Capture Frame ──────────────────────────────────────────────────────
  const captureFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    // Mirror to match the mirrored preview
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  // ── Send Frame via WebSocket ───────────────────────────────────────────
  const sendFrame = () => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected, cannot send frame");
      return;
    }

    // Only send frame if face quality is good
    if (!isFaceQualityGood()) {
      setFramesSkippedQuality((prev) => prev + 1);
      console.debug("Skipping frame - face quality not good enough");
      return;
    }

    const frame = captureFrame();
    const message = {
      type: "frame",
      insuree_uuid: insureeUuid,
      frame: frame,
      claim_code: claimCode || null,  // Include claim_code for audit trail
      step_name: "verification",  // Default step name
      device_id: navigator.userAgent,  // Browser user agent as device ID
    };

    wsRef.current.send(JSON.stringify(message));
    // Increment sent counter immediately when frame is sent
    setFramesSent((prev) => prev + 1);
  };

  // ── Start Streaming ────────────────────────────────────────────────────
  const startStreaming = () => {
    // Send frames at 5 fps (backend samples every 5 seconds)
    const FPS = 5;
    const interval = 1000 / FPS;

    streamIntervalRef.current = setInterval(() => {
      sendFrame();
    }, interval);
  };

  // ── Stop Streaming ─────────────────────────────────────────────────────
  const stopStreaming = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  };

  // ── Start Verification ─────────────────────────────────────────────────
  const handleStartVerification = () => {
    if (!insureeUuid.trim()) {
      alert("Please enter an Insuree UUID");
      return;
    }

    // Connect WebSocket if not connected
    if (wsStatus !== "connected") {
      connectWebSocket();
      // Wait for connection before starting
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          setIsVerifying(true);
          setVerificationCount(0);
          setFramesSent(0);
          setFramesSkippedQuality(0);
          setResult(null);
          startStreaming();
        } else {
          alert("WebSocket connection failed. Please try again.");
        }
      }, 1000);
    } else {
      setIsVerifying(true);
      setVerificationCount(0);
      setFramesSent(0);
      setFramesSkippedQuality(0);
      setResult(null);
      startStreaming();
    }
  };

  // ── Stop Verification ──────────────────────────────────────────────────
  const handleStopVerification = () => {
    setIsVerifying(false);
    stopStreaming();
  };

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopStreaming();
      disconnectWebSocket();
    };
  }, []);

  // ── Result class ───────────────────────────────────────────────────────
  const resultClass = () => {
    if (!result) return "";
    if (result.error) return classes.error;
    return result.verified ? classes.verified : classes.rejected;
  };

  const canVerify = cameraReady && insureeUuid.trim().length > 0 && !isVerifying;

  // Connection status badge
  const getConnectionStatusClass = () => {
    if (wsStatus === "connected") return classes.connected;
    if (wsStatus === "connecting") return classes.connecting;
    return classes.disconnected;
  };

  const getConnectionStatusText = () => {
    if (wsStatus === "connected") return "● Connected";
    if (wsStatus === "connecting") return "● Connecting...";
    return "● Disconnected";
  };

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.root}>
        <Box className={classes.wrapper}>
          <Grid container spacing={0} sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* Left Panel - Explanatory Section */}
            <Grid item xs={12} md={5} className={classes.leftPanel}>
              <img src="/front/src/openIMIS.png" alt="openIMIS" className={classes.logo} />
              <Typography className={classes.leftTitle}>
                Beneficiary Identity Verification
              </Typography>
              <Typography className={classes.leftText}>
                This page is designed to verify the identity of beneficiaries to confirm that they are
                alive and eligible to receive their designated benefit package.
              </Typography>
              <Typography className={classes.leftText}>
                The system uses biometric facial recognition to perform a liveness check and identity
                match against the enrolled reference photo. This process ensures that benefits are
                delivered to the correct individual and helps prevent fraud.
              </Typography>

              <Box className={classes.iconFeature}>
                <VerifiedUserIcon />
                <Typography>Secure biometric verification</Typography>
              </Box>
              <Box className={classes.iconFeature}>
                <CheckCircleIcon />
                <Typography>Real-time streaming verification</Typography>
              </Box>

              {/* Insuree Details - Moved from right panel */}
              <Box style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <Typography style={{ fontSize: "0.85rem", marginBottom: 12, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>
                  Beneficiary Information
                </Typography>

                <TextField
                  variant="outlined"
                  label="Insuree UUID"
                  value={insureeUuid}
                  onChange={(e) => setInsureeUuid(e.target.value)}
                  inputProps={{ autoComplete: "off", spellCheck: false }}
                  disabled={isVerifying}
                  size="small"
                  fullWidth
                  style={{ marginBottom: 12 }}
                  sx={{
                    "& .MuiInputBase-root": { background: "rgba(255,255,255,0.15)", color: "#fff" },
                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.8)" },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" },
                    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#fff",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#fff",
                    },
                    "& input": { color: "#fff" }
                  }}
                />

                <TextField
                  variant="outlined"
                  label="Claim Code (optional)"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value)}
                  inputProps={{ autoComplete: "off", spellCheck: false }}
                  disabled={isVerifying}
                  size="small"
                  fullWidth
                  sx={{
                    "& .MuiInputBase-root": { background: "rgba(255,255,255,0.15)", color: "#fff" },
                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.8)" },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" },
                    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#fff",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#fff",
                    },
                    "& input": { color: "#fff" }
                  }}
                />
              </Box>
            </Grid>

            {/* Right Panel - Camera & Verification */}
            <Grid item xs={12} md={7} className={classes.rightPanel}>
              <Typography className={classes.title}>Verification Process</Typography>

              {/* WebSocket Connection Status */}
              <Box className={`${classes.connectionStatus} ${getConnectionStatusClass()}`}>
                {getConnectionStatusText()}
              </Box>

              <div className={classes.cameraWrap}>
                <video ref={videoRef} className={classes.video} autoPlay playsInline muted />
              </div>

              {/* Two columns below camera */}
              <Grid container spacing={2} className={classes.columnsContainer}>
                {/* Left Column: Video Quality Checks */}
                <Grid item xs={12} sm={6} className={classes.gridContainer2} >
                  <Box className={classes.columnBox}>
                    <Typography className={classes.sectionTitle}>Video Quality</Typography>
                    {cameraReady && modelsLoaded && (
                      <Box className={classes.qualityIndicators}>
                        {/* Face Detection */}
                        <Box
                          className={`${classes.qualityItem} ${
                            faceDetected ? classes.qualityGood : classes.qualityBad
                          }`}
                        >
                          <span>Face Detected</span>
                          <span>{faceDetected ? "✓" : "✗"}</span>
                        </Box>

                        {/* Position */}
                        {faceDetected && faceQuality.position && (
                          <Box
                            className={`${classes.qualityItem} ${
                              faceQuality.position === "centered"
                                ? classes.qualityGood
                                : classes.qualityWarning
                            }`}
                          >
                            <span>Position</span>
                            <span>
                              {faceQuality.position === "centered"
                                ? "Centered ✓"
                                : `Move ${faceQuality.position}`}
                            </span>
                          </Box>
                        )}

                        {/* Distance */}
                        {faceDetected && faceQuality.distance && (
                          <Box
                            className={`${classes.qualityItem} ${
                              faceQuality.distance === "good"
                                ? classes.qualityGood
                                : classes.qualityWarning
                            }`}
                          >
                            <span>Distance</span>
                            <span>
                              {faceQuality.distance === "good"
                                ? "Good ✓"
                                : faceQuality.distance === "too_close"
                                ? "Move back"
                                : "Move closer"}
                            </span>
                          </Box>
                        )}

                        {/* Brightness */}
                        {faceDetected && faceQuality.brightness && (
                          <Box
                            className={`${classes.qualityItem} ${
                              faceQuality.brightness === "good"
                                ? classes.qualityGood
                                : classes.qualityWarning
                            }`}
                          >
                            <span>Lighting</span>
                            <span>
                              {faceQuality.brightness === "good"
                                ? "Good ✓"
                                : "Too dark - add light"}
                            </span>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Right Column: Identity Verification */}
                <Grid item xs={12} sm={6} className={classes.gridContainer2}>
                  <Box className={classes.columnBox}>
                    <Typography className={classes.sectionTitle}>Identity Verification</Typography>

                    {/* Ready Indicator */}
                    {cameraReady && modelsLoaded && isVerifying && (
                      <Box
                        className={`${classes.readyIndicator} ${
                          isFaceQualityGood() ? classes.ready : classes.notReady
                        }`}
                        style={{ marginTop: 0 }}
                      >
                        {isFaceQualityGood() ? (
                          <>
                            <CheckCircleIcon fontSize="small" />
                            <span>Ready</span>
                          </>
                        ) : (
                          <>
                            <WarningIcon fontSize="small" />
                            <span>Waiting...</span>
                          </>
                        )}
                      </Box>
                    )}

                    {/* Verification Stats */}
                    {isVerifying && (
                      <Box style={{ marginTop: 8, fontSize: "0.85rem", textAlign: "center", color: "#006273" }}>
                        <div>Sent: {framesSent}</div>
                        <div>Skipped: {framesSkippedQuality + Math.max(0, framesSent - verificationCount)}</div>
                        <div>Verified: {verificationCount}</div>
                      </Box>
                    )}

                    {/* Verification Result - Moved inside Identity Verification column */}
                    {result && (
                      <Box
                        className={resultClass()}
                        style={{
                          marginTop: 12,
                          padding: 12,
                          borderRadius: 8,
                          textAlign: "center",
                          fontSize: "0.9rem"
                        }}
                      >
                        <Box style={{ fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          {result.error ? (
                            <>
                              <CancelIcon fontSize="small" />
                              <span>Error</span>
                            </>
                          ) : result.verified ? (
                            <>
                              <CheckCircleIcon fontSize="small" />
                              <span>Verified</span>
                            </>
                          ) : (
                            <>
                              <CancelIcon fontSize="small" />
                              <span>Not Verified</span>
                            </>
                          )}
                        </Box>
                        {result.error && (
                          <Box style={{ fontSize: "0.75rem", marginTop: 4 }}>{result.error}</Box>
                        )}
                        {!result.error && result.confidence != null && (
                          <Box style={{ fontSize: "0.75rem", marginTop: 4 }}>
                            {result.confidence.toFixed(1)}%
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Hidden canvas for frame capture */}
              <canvas ref={canvasRef} width={640} height={640} style={{ display: "none" }} />

              {cameraError && (
                <Typography style={{ color: "#801a00", marginBottom: 16, textAlign: "center" }}>
                  {cameraError}
                </Typography>
              )}

              <Box className={classes.buttonGroup}>
                {!isVerifying ? (
                  <Button
                    className={classes.button}
                    variant="contained"
                    disabled={!canVerify}
                    onClick={handleStartVerification}
                  >
                    {wsStatus === "connecting" ? (
                      <CircularProgress size={22} style={{ color: "#fff" }} />
                    ) : (
                      "Start Verification"
                    )}
                  </Button>
                ) : (
                  <Button
                    className={classes.stopButton}
                    variant="contained"
                    onClick={handleStopVerification}
                  >
                    Stop Verification
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </div>
    </ThemeProvider>
  );
};

export default BiometricVerifyPage;
