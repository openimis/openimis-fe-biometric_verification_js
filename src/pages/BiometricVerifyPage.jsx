import { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { makeStyles } from "@mui/styles";
import { Button, CircularProgress, Paper, TextField, Typography, Box, Grid } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useGraphqlMutation } from "@openimis/fe-core";
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
}));

const VERIFY_MUTATION = `
  mutation VerifyFace($input: VerifyFaceInput!) {
    verifyFace(input: $input) {
      internal_id
      clientMutationId
    }
  }
`;

const RESULT_QUERY = `
  query VerificationResult($clientMutationId: String!) {
    verificationResult(clientMutationId: $clientMutationId) {
      verified
      confidence
      distance
      provider
      error
    }
  }
`;

const BiometricVerifyPage = () => {
  const classes = useStyles();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const { uuid } = useParams(); // Read insuree UUID from URL parameter

  const [insureeUuid, setInsureeUuid] = useState(uuid || "");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [result, setResult] = useState(null); // { verified, confidence, distance, provider, error }
  const [isVerifying, setIsVerifying] = useState(false); // Auto-verify in progress
  const [captureCount, setCaptureCount] = useState(0);

  const { isLoading, mutate } = useGraphqlMutation(VERIFY_MUTATION, { wait: false });

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

  // ── Capture ────────────────────────────────────────────────────────────
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

  // ── Fetch result from backend ─────────────────────────────────────────
  const fetchResult = async (clientMutationId) => {
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: RESULT_QUERY,
          variables: { clientMutationId },
        }),
      });
      const json = await response.json();
      return json?.data?.verificationResult || null;
    } catch (err) {
      return null;
    }
  };

  // ── Single Verify ──────────────────────────────────────────────────────
  const performVerification = async () => {
    setResult(null);
    const frame = captureFrame();
    try {
      // Step 1: Call mutation to start verification
      const resp = await mutate({ uuid: insureeUuid, frame });
      const mutationData = resp?.data?.verifyFace;
      if (!mutationData?.clientMutationId) {
        throw new Error("No clientMutationId returned from mutation.");
      }

      const clientMutationId = mutationData.clientMutationId;

      // Step 2: Poll for result every 500ms, max 20 attempts (10 seconds)
      let attempts = 0;
      const maxAttempts = 20;

      const pollResult = async () => {
        const result = await fetchResult(clientMutationId);
        if (result && (result.verified !== undefined || result.error)) {
          // Got a result
          setResult(result);
          setCaptureCount((prev) => prev + 1);
          return result;
        }

        attempts += 1;
        if (attempts >= maxAttempts) {
          const timeoutResult = {
            verified: false,
            error: "Verification timeout. Please try again.",
          };
          setResult(timeoutResult);
          return timeoutResult;
        }

        // Wait 500ms and try again
        await new Promise((resolve) => setTimeout(resolve, 500));
        return pollResult();
      };

      return await pollResult();
    } catch (err) {
      const errorResult = { verified: false, error: err.message };
      setResult(errorResult);
      return errorResult;
    }
  };

  // ── Start Auto Verification ────────────────────────────────────────────
  const handleStartVerification = async () => {
    setIsVerifying(true);
    setCaptureCount(0);
    setResult(null);

    // First immediate capture
    await performVerification();

    // Then every 15 seconds
    intervalRef.current = setInterval(async () => {
      await performVerification();
    }, 15000);
  };

  // ── Stop Auto Verification ─────────────────────────────────────────────
  const handleStopVerification = () => {
    setIsVerifying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // ── Cleanup interval on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // ── Result class ───────────────────────────────────────────────────────
  const resultClass = () => {
    if (!result) return "";
    if (result.error) return classes.error;
    return result.verified ? classes.verified : classes.rejected;
  };

  const canVerify = cameraReady && insureeUuid.trim().length > 0 && !isVerifying;

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
            <Typography>Real-time liveness detection</Typography>
          </Box>
        </Grid>

        {/* Right Panel - Camera & Verification */}
        <Grid item xs={12} md={7} className={classes.rightPanel}>
          <Typography className={classes.title}>Verification Process</Typography>

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
                {isLoading ? (
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
              Verification in progress... (Capture #{captureCount + 1})
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
                  Total captures: {captureCount}
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
