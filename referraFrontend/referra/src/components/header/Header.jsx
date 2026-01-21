import React from "react";
import "./Header.css";

const Header = (props) => {

  return (
    <div>
      <h3>Welcome back, {props.user?.firstname}</h3>
      <p>{props.text}</p>
      <button onClick={props.onLogout}>Logout</button>
      <button onClick={props.onClick}>{props.buttonText}</button>
    </div>
  );
};

export default Header;