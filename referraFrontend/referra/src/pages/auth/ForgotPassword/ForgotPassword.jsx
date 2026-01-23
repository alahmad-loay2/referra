import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../../api/auth.api.js";
import { Mail } from "lucide-react";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const result = await forgotPassword(email);
      setStatus(result.message);
      setEmail("");
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <img src="/logo.svg" alt="Aspire Software" className="forgot-logo" />

        <h2>Forgot your password?</h2>
        <p className="forgot-subtitle">
          Enter your email address and we’ll send you a link to reset your
          password.
        </p>

        {status && <div className="forgot-message">{status}</div>}

        <form onSubmit={handleSubmit}>
          <div className="forgot-field">
            <label htmlFor="email">Email address</label>
            <div className="forgot-input-icon">
              <Mail size={16} />
              <input
                type="email"
                id="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="forgot-btn" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="forgot-footer">
          <Link to="/login">← Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
