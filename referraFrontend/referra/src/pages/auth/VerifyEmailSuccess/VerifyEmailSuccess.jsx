import React, { useRef, useState } from "react";
import { verifyEmail } from "../../../api/auth.api.js";
import "./VerifyEmailSuccess.css";
const VerifyEmailSuccess = () => {
  const [status, setStatus] = useState("Verifying your email...");
  const verificationStarted = useRef(false);

  // Only run verification once, even if component re-renders
  if (!verificationStarted.current) {
    verificationStarted.current = true;

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.substring(1)
      : window.location.hash;

    const params = new URLSearchParams(hash);

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setStatus(
        "Missing verification tokens in URL. Please try the link again.",
      );
    } else {
      // Start verification asynchronously
      const verify = async () => {
        try {
          await verifyEmail(access_token, refresh_token);
          setStatus(
            "Your email has been verified and your account is ready to use.",
          );
        } catch (err) {
          setStatus(err.message);
        }
      };

      verify();
    }
  }

  return (
    <div className="verify-page">
      <div className="verify-card">
        <h3 className="verify-message">{status}</h3>
      </div>
    </div>
  );
};

export default VerifyEmailSuccess;
