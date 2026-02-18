import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signin } from "../../../api/auth.api.js";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
// Login page that allows users to enter their email and password to sign in.
//  It shows a loading state while the request is being processed and displays error messages based on the API response.
// It also has a toggle to show/hide the password and a link to the forgot password page.
import "./Login.css";
const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await signin(email, password);
      setMessage(result.message);

      const role = result?.user?.Role || result?.user?.role;
      if (role === "HR") {
        navigate("/dashboard/hr");
      } else if (role === "Employee") {
        navigate("/dashboard/employee");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT */}
      <div className="login-left">
        <img src="/logo.svg" alt="Aspire Software" className="logo_login" />

        <h1>Welcome Back</h1>
        <p className="login-subtitle">
          Sign in to access your referral dashboard
        </p>
        {message && <div className="login-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-login">
            <label htmlFor="login-email">Email</label>
            <div className="input-icon-login">
              <Mail size={16} />
              <input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>

          <div className="field-login">
            <div className="password-row">
              <label htmlFor="login-password">Password</label>
              <Link
                to="/auth/forgot-password"
                className="forgot-password-inline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="input-icon-login">
              <Lock size={16} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
              />
              {showPassword ? (
                <EyeOff
                  size={16}
                  className="eye"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <Eye
                  size={16}
                  className="eye"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>
          </div>
          <button className="btn-login" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          Don't have an account?
          <Link to="/register">Create account</Link>
        </div>
      </div>
      {/* RIGHT*/}
      <div className="login-right">
        <div className="login-right-content">
          <div className="login-right-icon">
            <UsersIcon />
          </div>
          <h2>Empower your team</h2>
          <p>
            Track referrals, earn bonuses, and help build an amazing team—all
            from one dashboard
          </p>
          <div className="login-stats">
            <div className="login-stat">
              <span className="login-stat-number">2,500+</span>
              <span className="login-stat-label">Employees</span>
            </div>

            <div className="login-stat">
              <span className="login-stat-number">15+</span>
              <span className="login-stat-label">Departments</span>
            </div>

            <div className="login-stat">
              <span className="login-stat-number">$150K</span>
              <span className="login-stat-label">Bonuses Paid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const UsersIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default LoginPage;
