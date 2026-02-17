import React, { useEffect, useState } from "react";
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(max-width: 768px)")?.matches ?? false;
  });

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

  // Desktop-only collapsible sidebar: force open on mobile widths
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia("(max-width: 768px)");

    const onChange = (e) => {
      setIsMobile(e.matches);
      if (e.matches) {
        setIsSidebarCollapsed(false);
      }
    };

    // Set initial value (in case hydration differs)
    setIsMobile(mql.matches);
    if (mql.matches) setIsSidebarCollapsed(false);

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    // Safari fallback
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

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
    <div
      className={`dashboardContainer ${
        isSidebarCollapsed && !isMobile ? "sidebar-collapsed" : ""
      }`}
    >
      <div id="Sidebar">
        <Sidebar
          pages={pages}
          isCollapsed={isSidebarCollapsed && !isMobile}
          onCollapseSidebar={
            isMobile ? undefined : () => setIsSidebarCollapsed(true)
          }
        />
      </div>
      <div id="Header">
        <Header
          text="Manage referrals and track hiring progress"
          buttonText="View Referrals"
          to="/dashboard/hr/referrals"
          isSidebarCollapsed={isSidebarCollapsed && !isMobile}
          onToggleSidebar={
            isMobile ? undefined : () => setIsSidebarCollapsed(false)
          }
          hideText={hideHeader}
        />
      </div>
      <div id="Content">
        <Outlet />
      </div>
    </div>
  );
};

export default HrDashboard;
