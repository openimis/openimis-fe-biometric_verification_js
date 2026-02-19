import React, { useRef, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/styles";
import { Button, CircularProgress, Paper, TextField, Typography } from "@material-ui/core";
import { useGraphqlMutation } from "@openimis/fe-core";

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 16,
  },
  title: {
    color: "#f1f5f9",
    fontWeight: 600,
    fontSize: "1.25rem",
    letterSpacing: "0.02em",
  },
  cameraWrap: {
    width: 320,
    height: 320,
    borderRadius: "50%",
    overflow: "hidden",
    border: "3px solid #334155",
    background: "#1e293b",
    flexShrink: 0,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)", // mirror preview
  },
  input: {
    width: 320,
    "& .MuiInputBase-root": { background: "#1e293b", color: "#f1f5f9" },
    "& .MuiInputLabel-root": { color: "#64748b" },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#334155" },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#6366f1",
    },
  },
  button: {
    width: 320,
    background: "#6366f1",
    color: "#fff",
    fontWeight: 600,
    "&:hover": { background: "#4f46e5" },
    "&:disabled": { background: "#334155", color: "#64748b" },
  },
  result: {
    width: 320,
    padding: 16,
    borderRadius: 8,
    textAlign: "center",
  },
  verified: {
    background: "#14532d",
    color: "#4ade80",
  },
  rejected: {
    background: "#7f1d1d",
    color: "#f87171",
  },
  error: {
    background: "#1e293b",
    color: "#94a3b8",
  },
  detail: {
    fontSize: "0.8rem",
    marginTop: 6,
    opacity: 0.8,
  },
}));

const VERIFY_MUTATION = `
  mutation VerifyFace($uuid: String!, $frame: String!) {
    verifyFace(insureeUuid: $uuid, frameB64: $frame) {
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

  const [insureeUuid, setInsureeUuid] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [result, setResult] = useState(null); // { verified, confidence, distance, provider, error }

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

  // ── Verify ─────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    setResult(null);
    const frameB64 = captureFrame();
    try {
      const resp = await mutate({ uuid: insureeUuid, frame: frameB64 });
      const data = resp?.data?.verifyFace;
      if (!data) throw new Error("Empty response from server.");
      setResult(data);
    } catch (err) {
      setResult({ verified: false, error: err.message });
    }
  };

  // ── Result class ───────────────────────────────────────────────────────
  const resultClass = () => {
    if (!result) return "";
    if (result.error) return classes.error;
    return result.verified ? classes.verified : classes.rejected;
  };

  const canVerify = cameraReady && insureeUuid.trim().length > 0 && !isLoading;

  return (
    <div className={classes.root}>
      <Typography className={classes.title}>Identity Verification</Typography>

      <div className={classes.cameraWrap}>
        <video ref={videoRef} className={classes.video} autoPlay playsInline muted />
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} width={640} height={640} style={{ display: "none" }} />

      {cameraError && (
        <Typography style={{ color: "#f87171", width: 320, textAlign: "center" }}>
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
        size="small"
      />

      <Button
        className={classes.button}
        variant="contained"
        disabled={!canVerify}
        onClick={handleVerify}
      >
        {isLoading ? <CircularProgress size={22} style={{ color: "#fff" }} /> : "Verify"}
      </Button>

      {result && (
        <Paper className={`${classes.result} ${resultClass()}`} elevation={0}>
          <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
            {result.error
              ? result.error
              : result.verified
              ? "✓ Identity verified"
              : "✗ Identity not verified"}
          </Typography>
          {!result.error && result.confidence != null && (
            <Typography className={classes.detail}>
              Confidence: {result.confidence.toFixed(1)}% · Provider: {result.provider}
            </Typography>
          )}
        </Paper>
      )}
    </div>
  );
};

export default BiometricVerifyPage;
