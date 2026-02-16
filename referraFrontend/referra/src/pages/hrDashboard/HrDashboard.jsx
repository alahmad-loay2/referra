import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./HrDashboard.css";
import Sidebar from "../../components/sidebar/Sidebar.jsx";
import { LayoutDashboard, Users, Briefcase, UserCog } from "lucide-react";
import Header from "../../components/header/Header.jsx";
import { clearUserStoreOnAuthFailure } from "../../utils/auth.utils.js";
// Hr Dashboard is the main layout component for the HR dashboard section of the application.
// It includes a sidebar for navigation between different pages (dashboard home, referrals, positions, HR team) and a header that is shown on most pages except the referral details page.
// The component also sets up a global fetch interceptor to handle authentication failures by clearing the user store and redirecting to the login page.
const HrDashboard = () => {
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

  const hideHeader =
    (location.pathname.startsWith("/dashboard/hr/referrals/") &&
      location.pathname !== "/dashboard/hr/referrals") ||
    location.pathname === "/dashboard/hr/account";
  return (
    <div className="dashboardContainer">
      <div id="Sidebar">
        <Sidebar pages={pages} />
      </div>

      {!hideHeader && (
        <div id="Header">
          <Header
            text="Manage referrals and track hiring progress"
            buttonText="View Referrals"
            to="/dashboard/hr/referrals"
          />
        </div>
      )}
      <div id="Content">
        <Outlet />
      </div>
    </div>
  );
};

export default HrDashboard;
