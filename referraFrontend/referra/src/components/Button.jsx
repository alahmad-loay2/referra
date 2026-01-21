import { Link } from "react-router-dom";

const Button = ({ text, to, variant = "primary", className = "" }) => {
  const baseClass = variant === "secondary" ? "button-style-2" : "button-style";

  return (
    <Link to={to} className={`${baseClass} ${className}`}>
      {text}
    </Link>
  );
};

export default Button;
