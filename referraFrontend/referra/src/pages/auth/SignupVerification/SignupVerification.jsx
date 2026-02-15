import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../../api/auth.api.js";
import "./SignupVerification.css";
// simple page that checks if the user has been authenticated after signing up and email verification.
const SignupVerification = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await getCurrentUser();
        const role = res?.user?.Role || res?.user?.role;

        if (role === "Employee") {
          setStatus("Redirecting...");
          // Small delay to show redirecting message
          setTimeout(() => {
            navigate("/dashboard/employee", { replace: true });
          }, 500);
        }
      } catch (err) {
        // User not authenticated yet, continue checking
      }
    };

    // Check immediately
    checkAuth();

    // Check every 10 seconds
    const interval = setInterval(() => {
      checkAuth();
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="signup-verification-page">
      <div className="signup-verification-card">
        <p className="signup-verification-message">{status}</p>
      </div>
    </div>
  );
};

export default SignupVerification;
