import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/auth.api.js";

const HrDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // ignore errors for now
    } finally {
      navigate("/login");
    }
  };

  return (
    <div>
      <h1>Hello HR</h1>
      <button onClick={handleLogout}>Logout</button>
      <button>Create New HR</button>
      <div>
        <input type="text" placeholder="Full Name" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
      </div>
    </div>
  );
};

export default HrDashboard;