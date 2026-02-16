import React, { useEffect } from "react";
import "./Header.css";
import Button from "../button/Button";
import { getUserInfo } from "../../api/user.api.js";
import { useUserStore } from "../../store/userStore.js";
// Header component that displays a greeting with the user's first name and a button for navigation. It fetches user info on mount to get the first name and admin status.
const Header = (props) => {
  const firstName = useUserStore((state) => state.firstName);
  const setFirstName = useUserStore((state) => state.setFirstName);
  const setIsAdmin = useUserStore((state) => state.setIsAdmin);
  const setIsHr = useUserStore((state) => state.setIsHr);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserInfo();
        if (userData?.FirstName) {
          setFirstName(userData.FirstName);
        }
        // Set isAdmin if user is HR and admin
        if (userData?.Role === "HR" && userData?.Hr?.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        // Set isHr if user is HR
        if (userData?.Role === "HR") {
          setIsHr(true);
        } else {
          setIsHr(false);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };

    // Only fetch if firstName is not already set
    if (!firstName) {
      fetchUser();
    }
  }, [firstName, setFirstName, setIsAdmin, setIsHr]);

  return (
    <div className="headerContainer">
      <div>
        <h3>Hello {firstName || "..."}</h3>
        <p>{props.text}</p>
      </div>
      <Button text={props.buttonText} to={props.to} />
    </div>
  );
};

export default Header;
