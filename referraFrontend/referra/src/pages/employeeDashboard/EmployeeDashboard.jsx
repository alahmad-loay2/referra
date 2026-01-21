import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/auth.api.js";

const EmployeeDashboard = () => {
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
      <h1>Hello Employee</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default EmployeeDashboard;