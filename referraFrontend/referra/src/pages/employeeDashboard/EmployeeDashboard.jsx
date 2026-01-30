import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../../components/header/Header.jsx";
import Sidebar from "../../components/sidebar/Sidebar.jsx";
import { Briefcase, LayoutDashboard, UserCog, Users } from "lucide-react";
import "./EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const location = useLocation();

  const pages = [
    {
      name: "Dashboard",
      link: "/dashboard/employee",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "My Referrals",
      link: "/dashboard/employee/my-referrals",
      icon: <Users size={18} />,
    },
    {
      name: "Open Positions",
      link: "/dashboard/employee/open-positions",
      icon: <Briefcase size={18} />,
    },
    {
      name: "Submit Referrals",
      link: "/dashboard/employee/submit-referrals",
      icon: <UserCog size={18} />,
    },
  ];

  const user = {
    firstname: "John",
  };

  const hideHeader =
    location.pathname === "/dashboard/employee/submit-referrals" ||
    location.pathname.startsWith("/dashboard/employee/referral-history");
  return (
    <div className="employeeDashboardContainer">
      <div id="Sidebar">
        <Sidebar pages={pages} />
      </div>
      {!hideHeader && (
        <div id="Header">
          <Header
            user={user}
            text="Track your referrals and help us build an amazing team"
            buttonText="Submit a Referral"
            to="/dashboard/employee/submit-referrals"
          />
        </div>
      )}

      <div id="Content">
        <Outlet />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
