import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../api/auth.api.js";

const AuthProtection = () => {
  const [status, setStatus] = useState("loading"); 

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await getCurrentUser();
        const role = res?.user?.Role || res?.user?.role;
        if (role === "Employee") {
          setStatus("employee");
        } else if (role === "HR") {
          setStatus("hr");
        } else {
          setStatus("ok");
        }
      } catch {
        setStatus("ok");
      }
    };
    checkUser();
  }, []);

if(status === "loading") {
    return <div>Loading...</div>;
}

if(status === "employee") {
    return <Navigate to="/dashboard/employee" replace />;
}

if(status === "hr") {
    return <Navigate to="/dashboard/hr" replace />;
}

return <Outlet />;

};

export default AuthProtection;

