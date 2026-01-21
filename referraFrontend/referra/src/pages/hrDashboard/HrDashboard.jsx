import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { logout, getCurrentUser } from "../../api/auth.api.js";
import "./HrDashboard.css";
import Sidebar from "../../components/sidebar/Sidebar.jsx";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCog,
} from "lucide-react";
import Header from "../../components/header/Header.jsx";

const HrDashboard = () => {
  const navigate = useNavigate();

  const pages = [
    {
      name: "Dashboard",
      link: "/dashboard/hr",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Referrals",
      link: "/dashboard/hr/referrals",
      icon: <Users size={18} />,
    },
    {
      name: "Positions",
      link: "/dashboard/hr/positions",
      icon: <Briefcase size={18} />,
    },
    {
      name: "HR Team",
      link: "/dashboard/hr/team",
      icon: <UserCog size={18} />,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      navigate("/login");
    }
  };

  const user = {
    firstname: "John"
  }

  return (
    <div className="dashboardContainer">
      <div id="Sidebar">
        <Sidebar pages={pages} />
      </div>
      <div id="Header">
        <Header onLogout={handleLogout} user={user} text="You are logged in as an HR" buttonText="Create Referral" onClick={() => navigate("/dashboard/hr/referrals/create")} />
      </div>
      <div id="Content">
        <Outlet />
      </div>
    </div>
  );
};

export default HrDashboard;