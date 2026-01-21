import React from "react";
import { logout } from "../../../api/auth.api.js"
import { useNavigate } from "react-router-dom";

const HrDashboardHome = () => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      navigate("/login");
    }
  };
  return (
    <div>
      <h1>HR Dashboard</h1>
      <p>Overview and key HR metrics will go here.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default HrDashboardHome;

