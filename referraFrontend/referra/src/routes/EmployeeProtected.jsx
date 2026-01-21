import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../api/auth.api.js";

const EmployeeProtected = () => {
  const [status, setStatus] = useState("loading"); 

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await getCurrentUser();
        const role = res?.user?.Role || res?.user?.role;
        if (role === "Employee") {
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
    return <div>Loading...</div>;
  }

  if (status === "redirect") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default EmployeeProtected;

