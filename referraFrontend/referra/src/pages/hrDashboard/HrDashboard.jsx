import React from "react";
import { Outlet, useLocation } from "react-router-dom";
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
  const location = useLocation();

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

  const hideHeader = location.pathname === "/dashboard/hr/account";

  return (
    <div className="dashboardContainer">
      <div id="Sidebar">
        <Sidebar pages={pages} />
      </div>
      {!hideHeader && (
        <div id="Header">
          <Header text="Manage referrals and track hiring progress" buttonText="View Referral" to="/dashboard/hr/referrals" />
        </div>
      )}
      <div id="Content">
        <Outlet />
      </div>
    </div>
  );
};

export default HrDashboard;