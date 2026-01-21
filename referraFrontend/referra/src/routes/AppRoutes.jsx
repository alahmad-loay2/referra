import React from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/home/HomePage.jsx";
import HrDashboard from "../pages/hrDashboard/HrDashboard.jsx";
import HrDashboardHome from "../pages/hrDashboard/HrDashboardHome/HrDashboardHome.jsx";
import HrReferrals from "../pages/hrDashboard/HrReferrals/HrReferrals.jsx";
import HrPositions from "../pages/hrDashboard/HrPositions/HrPositions.jsx";
import HrTeam from "../pages/hrDashboard/HrTeam/HrTeam.jsx";
import EmployeeDashboard from "../pages/employeeDashboard/EmployeeDashboard.jsx";
import HrProtected from "./HrProtected.jsx";
import EmployeeProtected from "./EmployeeProtected.jsx";
import AuthProtection from "./AuthProtection.jsx";
import LoginPage from "../pages/auth/Login/Login.jsx";
import Register from "../pages/auth/Register/Register.jsx";
import VerifyEmailSuccess from "../pages/auth/VerifyEmailSuccess/VerifyEmailSuccess.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword/ForgotPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword/ResetPassword.jsx";

const AppRoutes = () => {
  return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<AuthProtection />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route
          path="/auth/verify-email-success"
          element={<VerifyEmailSuccess />}
        />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route element={<HrProtected />}>
          <Route path="/dashboard/hr" element={<HrDashboard />}>
            <Route index element={<HrDashboardHome />} />
            <Route path="referrals" element={<HrReferrals />} />
            <Route path="positions" element={<HrPositions />} />
            <Route path="team" element={<HrTeam />} />
          </Route>
        </Route>
        <Route element={<EmployeeProtected />}>
          <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
        </Route>
      </Routes>
  );
};

export default AppRoutes;
