import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./HrDashboard.css";
import Sidebar from "../../components/sidebar/Sidebar.jsx";
import { LayoutDashboard, Users, Briefcase, UserCog, Building2 } from "lucide-react";
import Header from "../../components/header/Header.jsx";
import { getUserInfo } from "../../api/user.api.js";

const HrDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if ((response.status === 401 || response.status === 403) && window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [navigate]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const data = await getUserInfo();
        if (data?.Role === "HR" && data?.Hr?.isAdmin) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Failed to fetch user info in HrDashboard:", error);
      }
    };

    fetchUserRole();
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
    ...(isAdmin
      ? [
          {
            name: "Departments",
            link: "/dashboard/hr/departments",
            icon: <Building2 size={18} />,
          },
        ]
      : []),
  ];

  const hideHeader =
    location.pathname.startsWith("/dashboard/hr/referrals/") &&
    location.pathname !== "/dashboard/hr/referrals";
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
