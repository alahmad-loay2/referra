import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/header/Header.jsx";
import Sidebar from "../../components/sidebar/Sidebar.jsx";
import { Briefcase, LayoutDashboard, UserCog, Users } from "lucide-react";
import "./EmployeeDashboard.css";
import { clearUserStoreOnAuthFailure } from "../../utils/auth.utils.js";
// Employee Dashboard is the main layout component for the employee dashboard section of the application.
// It includes a sidebar for navigation between different pages (dashboard home, referral history, open positions, submit referrals, account settings) and a header that is shown on most pages except the referral submission and details pages.
const EmployeeDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (
        (response.status === 401 || response.status === 403) &&
        window.location.pathname !== "/login"
      ) {
        // Clear Zustand store on authentication failure
        clearUserStoreOnAuthFailure();
        navigate("/login", { replace: true });
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [navigate]);

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

  const hideHeader =
    location.pathname === "/dashboard/employee/submit-referrals" ||
    location.pathname.startsWith("/dashboard/employee/referral-history") ||
    location.pathname === "/dashboard/employee/account" ||
    location.pathname.startsWith("/dashboard/employee/open-positions/");
  return (
    <div className="employeeDashboardContainer">
      <div id="Sidebar">
        <Sidebar pages={pages} />
      </div>
      {!hideHeader && (
        <div id="Header">
          <Header
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
