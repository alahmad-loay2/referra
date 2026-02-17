import React, { useEffect, useState } from "react";
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
    <div
      className={`employeeDashboardContainer ${
        isSidebarCollapsed && !isMobile ? "sidebar-collapsed" : ""
      }`}
    >
      <div id="Sidebar">
        <Sidebar
          pages={pages}
          isCollapsed={isSidebarCollapsed && !isMobile}
        />
      </div>
      {!hideHeader && (
        <div id="Header">
          <Header
            text="Track your referrals and help us build an amazing team"
            buttonText="Submit a Referral"
            to="/dashboard/employee/submit-referrals"
            isSidebarCollapsed={isSidebarCollapsed && !isMobile}
            onToggleSidebar={
              isMobile ? undefined : () => setIsSidebarCollapsed((v) => !v)
            }
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
