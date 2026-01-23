import React, { useState, useEffect } from "react";
import { resetPassword } from "../../../api/auth.api.js";
import "./ResetPassword.css";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.substring(1)
      : window.location.hash;

    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setStatus(
        "Missing reset tokens in URL. Please use the link from your email.",
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setStatus("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.substring(1)
      : window.location.hash;

    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setStatus("Missing reset tokens. Please use the link from your email.");
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(
        access_token,
        refresh_token,
        newPassword,
      );
      setStatus(result.message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h2 className="reset-title">Reset Password</h2>
        <p className="reset-subtitle">Enter your new password below.</p>

        {status && <div className="reset-message">{status}</div>}

        <form className="reset-form" onSubmit={handleSubmit}>
          <div className="reset-field">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter new password"
            />
          </div>

          <div className="reset-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Confirm new password"
            />
          </div>

          <button className="reset-btn" type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
