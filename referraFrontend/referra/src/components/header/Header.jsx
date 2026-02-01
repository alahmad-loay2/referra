import React, { useEffect, useState } from "react";
import "./Header.css";
import Button from "../button/Button";
import { getUserInfo } from "../../api/user.api.js";

const Header = (props) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserInfo();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const getDisplayName = () => {
    if (!user) return "User";
    return user.FirstName || "User";
  };

  const getRoleBadge = () => {
    if (!user || !user.Role) return null;
    
    const role = user.Role;
    return (
      <span className={`roleBadge ${role.toLowerCase()}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="headerContainer">
      <div>
        <h3>
          Hello {loading ? "..." : getDisplayName()}
          {user && getRoleBadge()}
        </h3>
        <p>{props.text}</p>
      </div>
      <Button text={props.buttonText} to={props.to} />
    </div>
  );
};

export default Header;