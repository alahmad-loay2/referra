import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signin } from "../../../api/auth.api.js";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div>
      <h2>Login</h2>
      {message && <div>{message}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div>
        <Link to="/auth/forgot-password">Forgot Password</Link>
      </div>

      <div>
        <Link to="/register">Switch to Register</Link>
      </div>

      <div>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
};

export default LoginPage;
