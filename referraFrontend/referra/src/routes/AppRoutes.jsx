import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "../pages/home/HomePage.jsx";
import VerifyEmailSuccess from "../pages/auth/VerifyEmailSuccess.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import HrDashboard from "../pages/hrDashboard/HrDashboard.jsx";
import EmployeeDashboard from "../pages/employeeDashboard/EmployeeDashboard.jsx";
import HrProtected from "./HrProtected.jsx";
import EmployeeProtected from "./EmployeeProtected.jsx";
import AuthProtection from "./AuthProtection.jsx";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<AuthProtection />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route path="/auth/verify-email-success" element={<VerifyEmailSuccess />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route element={<HrProtected />}>
          <Route path="/dashboard/hr" element={<HrDashboard />} />
        </Route>
        <Route element={<EmployeeProtected />}>
          <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
