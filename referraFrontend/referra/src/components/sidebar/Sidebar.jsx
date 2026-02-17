import React, { useEffect, useState, useRef } from "react";
import "./Sidebar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUserInfo } from "../../api/user.api.js";
import { logout } from "../../api/auth.api.js";
import { useUserStore } from "../../store/userStore.js";
import { Menu, X } from "lucide-react";
// Sidebar component that displays navigation links and user account info.
//  It fetches user info on mount to display the user's name and role, and provides a dropdown for account actions like going to account page and logging out and going to home page.
//  It also has a responsive burger menu for smaller screens.
const Sidebar = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isCollapsed = Boolean(props.isCollapsed);
  const dropdownRef = useRef(null);
  const accountRef = useRef(null);
  const menuRef = useRef(null);
  const burgerButtonRef = useRef(null);

  const setIsHr = useUserStore((state) => state.setIsHr);

  const fetchUser = async () => {
    try {
      const userData = await getUserInfo();
      setUser(userData);
      // Set isHr in zustand if user is HR
      if (userData?.Role === "HR") {
        setIsHr(true);
      } else {
        setIsHr(false);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [setIsHr]);

  // Listen for profile picture updates
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      fetchUser();
    };

    window.addEventListener(
      "profilePictureUpdated",
      handleProfilePictureUpdate,
    );
    return () => {
      window.removeEventListener(
        "profilePictureUpdated",
        handleProfilePictureUpdate,
      );
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        accountRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !accountRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
      if (
        menuRef.current &&
        burgerButtonRef.current &&
        !menuRef.current.contains(event.target) &&
        !burgerButtonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getFullName = () => {
    if (!user) return "User";
    const firstName = user.FirstName || "";
    const lastName = user.LastName || "";
    return `${firstName} ${lastName}`.trim() || "User";
  };

  const getInitials = () => {
    if (!user) return "U";
    const firstName = user.FirstName || "";
    const lastName = user.LastName || "";
    const firstInitial = firstName.charAt(0).toUpperCase() || "";
    const lastInitial = lastName.charAt(0).toUpperCase() || "";
    return `${firstInitial}${lastInitial}` || "U";
  };

  const getRoleBadge = () => {
    if (!user || !user.Role) return null;
    const role = user.Role;
    return (
      <span className={`sidebarRoleBadge ${role.toLowerCase()}`}>{role}</span>
    );
  };

  const handleAccountClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleGoToAccount = (e) => {
    e.stopPropagation();
    setShowDropdown(false);
    const basePath = location.pathname.startsWith("/dashboard/hr")
      ? "/dashboard/hr"
      : "/dashboard/employee";
    navigate(`${basePath}/account`);
  };

  const resetUserStore = useUserStore((state) => state.reset);
  const viewMode = useUserStore((state) => state.viewMode);
  const setViewMode = useUserStore((state) => state.setViewMode);
  const isHr = useUserStore((state) => state.isHr);

  // Check if user is HR (can switch accounts)
  const canSwitchAccounts = isHr;

  // Get current effective view mode
  const currentViewMode = viewMode || (isHr ? "hr" : "employee");

  const handleSwitchToEmployee = (e) => {
    e.stopPropagation();
    setViewMode("employee");
    setShowDropdown(false);
    navigate("/dashboard/employee");
  };

  const handleSwitchToHr = (e) => {
    e.stopPropagation();
    setViewMode("hr");
    setShowDropdown(false);
    navigate("/dashboard/hr");
  };

  const handleLogout = async (e) => {
    e.stopPropagation();
    try {
      await logout();
      // Clear Zustand user store on logout
      resetUserStore();
    } catch (error) {
      console.error(error);
      // Still clear store even if logout API call fails
      resetUserStore();
    } finally {
      navigate("/login");
    }
  };

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  const handleMenuLinkClick = () => {
    setShowMenu(false);
  };

  return (
    <div className={`sidebarContainer ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebarTop">
        <div className="sidebarLogoRow">
          <img
            src="/logoWhite.png"
            alt="Referra Logo"
            className="sidebarLogo"
          />
        </div>
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

        <button
          ref={burgerButtonRef}
          className="sidebarBurgerButton"
          onClick={handleMenuToggle}
          aria-label="Toggle menu"
        >
          {showMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {showMenu && (
        <div className="sidebarMenuDropdown" ref={menuRef}>
          {props.pages.map((page) => (
            <Link
              key={page.link}
              to={page.link}
              className={`sidebarMenuDropdownItem ${
                location.pathname === page.link ? "active" : ""
              }`}
              onClick={handleMenuLinkClick}
            >
              <span className="sidebarMenuIcon">{page.icon}</span>
              <span className="sidebarMenuText">{page.name}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="sidebarBottom">
        <div className="divider divider-bottom"></div>
        <div
          className="sidebarAccount"
          ref={accountRef}
          onClick={handleAccountClick}
        >
          <div className="sidebarAccountContent">
            <div className="sidebarAccountAvatar">
              {loading ? (
                <span>...</span>
              ) : user?.ProfileUrl ? (
                <img
                  src={user.ProfileUrl}
                  alt="Profile"
                  className="sidebarAccountAvatarImage"
                />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>
            <div className="sidebarAccountInfo">
              <div className="sidebarAccountName">
                {loading ? "Loading..." : getFullName()}
              </div>
              {user && getRoleBadge()}
            </div>
          </div>
          {showDropdown && (
            <div className="sidebarAccountDropdown" ref={dropdownRef}>
              {canSwitchAccounts && (
                <>
                  {currentViewMode === "hr" ? (
                    <button
                      className="sidebarAccountDropdownItem"
                      onClick={handleSwitchToEmployee}
                    >
                      Switch to Employee Account
                    </button>
                  ) : (
                    <button
                      className="sidebarAccountDropdownItem"
                      onClick={handleSwitchToHr}
                    >
                      Switch to HR Account
                    </button>
                  )}
                </>
              )}
              <button
                className="sidebarAccountDropdownItem"
                onClick={handleGoToAccount}
              >
                Go to account
              </button>
              <button
                className="sidebarAccountDropdownItem"
                onClick={handleLogout}
              >
                Logout
              </button>
              <button
                className="sidebarAccountDropdownItem"
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/");
                }}
              >
                Go back home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
