import React from 'react'
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../api/auth.api';

const EmployeeDashboardHome = () => {
    const navigate = useNavigate();
    const handleLogout = async () => {
      try {
        await logout();
      } catch (e) {
        console.error(e);
      } finally {
        navigate("/login");
      }
    };
  return (
    <div>EmployeeDashboardHome
        <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default EmployeeDashboardHome