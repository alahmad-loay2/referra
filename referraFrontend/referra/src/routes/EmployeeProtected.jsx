import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getUserInfo } from "../api/user.api.js";
import Loading from "../components/loading/Loading.jsx";

const EmployeeProtected = () => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getUserInfo();
        const role = user?.Role;
        
        // Allow access if user is Employee or HR
        if (role === "Employee" || role === "HR") {
          setStatus("ok");
        } else {
          setStatus("redirect");
        }
      } catch {
        setStatus("redirect");
      }
    };
    checkUser();
  }, []);

  if (status === "loading") {
    return (
      <div className="centerLoading">
        <Loading />
      </div>
    );
  }

  if (status === "redirect") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default EmployeeProtected;

