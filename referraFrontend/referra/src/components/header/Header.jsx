import React from "react";
import "./Header.css";
import Button from "../button/Button";

const Header = (props) => {

  return (
    <div className="headerContainer">
      <div>
      <h3>Welcome back, {props.user?.firstname}</h3>
      <p>{props.text}</p>
      </div>
      <Button text={props.buttonText} to={props.to} />
    </div>
  );
};

export default Header;