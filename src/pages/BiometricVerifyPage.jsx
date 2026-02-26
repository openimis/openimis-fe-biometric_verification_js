import { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { makeStyles } from "@mui/styles";
import { Button, CircularProgress, Paper, TextField, Typography, Box, Grid } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

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
    maxWidth: 400,
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
    maxWidth: 400,
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
    maxWidth: 400,
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

  const [insureeUuid, setInsureeUuid] = useState(uuid || "");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [result, setResult] = useState(null); // { verified, confidence, distance, provider, error }
  const [isVerifying, setIsVerifying] = useState(false); // Auto-verify in progress
  const [verificationCount, setVerificationCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [wsStatus, setWsStatus] = useState("disconnected"); // "disconnected" | "connecting" | "connected"

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
          setFrameCount(data.frame_count || 0);
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

    const frame = captureFrame();
    const message = {
      type: "frame",
      insuree_uuid: insureeUuid,
      frame: frame,
    };

    wsRef.current.send(JSON.stringify(message));
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
          setFrameCount(0);
          setResult(null);
          startStreaming();
        } else {
          alert("WebSocket connection failed. Please try again.");
        }
      }, 1000);
    } else {
      setIsVerifying(true);
      setVerificationCount(0);
      setFrameCount(0);
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

              {/* Hidden canvas for frame capture */}
              <canvas ref={canvasRef} width={640} height={640} style={{ display: "none" }} />

              {cameraError && (
                <Typography style={{ color: "#801a00", marginBottom: 16, textAlign: "center" }}>
                  {cameraError}
                </Typography>
              )}

              <TextField
                className={classes.input}
                variant="outlined"
                label="Insuree UUID"
                value={insureeUuid}
                onChange={(e) => setInsureeUuid(e.target.value)}
                inputProps={{ autoComplete: "off", spellCheck: false }}
                disabled={isVerifying}
                size="medium"
              />

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

              {isVerifying && (
                <Typography className={classes.status}>
                  Streaming verification...
                  <br />
                  Frames sent: {frameCount} · Verifications: {verificationCount}
                </Typography>
              )}

              {result && (
                <Paper className={`${classes.result} ${resultClass()}`} elevation={0}>
                  <Typography variant="h6" style={{ fontWeight: 600, marginBottom: 8 }}>
                    {result.error ? (
                      <>
                        <CancelIcon style={{ verticalAlign: "middle", marginRight: 8 }} />
                        Error
                      </>
                    ) : result.verified ? (
                      <>
                        <CheckCircleIcon style={{ verticalAlign: "middle", marginRight: 8 }} />
                        Identity Verified
                      </>
                    ) : (
                      <>
                        <CancelIcon style={{ verticalAlign: "middle", marginRight: 8 }} />
                        Identity Not Verified
                      </>
                    )}
                  </Typography>
                  {result.error && (
                    <Typography className={classes.detail}>{result.error}</Typography>
                  )}
                  {!result.error && result.confidence != null && (
                    <Typography className={classes.detail}>
                      Confidence: {result.confidence.toFixed(1)}% · Provider: {result.provider}
                      <br />
                      Total verifications: {verificationCount}
                    </Typography>
                  )}
                </Paper>
              )}
            </Grid>
          </Grid>
        </Box>
      </div>
    </ThemeProvider>
  );
};

export default BiometricVerifyPage;
