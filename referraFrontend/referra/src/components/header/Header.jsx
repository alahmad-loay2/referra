import React, { useEffect } from "react";
import "./Header.css";
import Button from "../button/Button";
import { getUserInfo } from "../../api/user.api.js";
import { useUserStore } from "../../store/userStore.js";

const Header = (props) => {
  const firstName = useUserStore((state) => state.firstName);
  const setFirstName = useUserStore((state) => state.setFirstName);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserInfo();
        if (userData?.FirstName) {
          setFirstName(userData.FirstName);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };

    // Only fetch if firstName is not already set
    if (!firstName) {
      fetchUser();
    }
  }, [firstName, setFirstName]);

  return (
    <div className="headerContainer">
      <div>
        <h3>
          Hello {firstName || "..."}
        </h3>
        <p>{props.text}</p>
      </div>
      <Button text={props.buttonText} to={props.to} />
    </div>
  );
};

export default Header;