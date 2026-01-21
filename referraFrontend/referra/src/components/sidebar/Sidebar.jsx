import React from "react";
import "./Sidebar.css";
import { Link, useLocation } from "react-router-dom";

const Sidebar = (props) => {
  const location = useLocation();

  return (
    <div className="sidebarContainer">
      <div className="sidebarTop">
        <img src="/logoWhite.png" alt="Referra Logo" className="sidebarLogo" />
        <div className="divider"></div>

        <nav className="sidebarNav">
          {props.pages.map((page) => (
            <Link
              key={page.link}
              to={page.link}
              className={`sidebarItem ${
                location.pathname === page.link ? "active" : ""
              }`}
            >
              <span className="sidebarIcon">{page.icon}</span>
              <span className="sidebarText">{page.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="sidebarBottom">
        <div className="divider divider-bottom"></div>
        <div className="sidebarAccount">Account</div>
      </div>
    </div>
  );
};

export default Sidebar;