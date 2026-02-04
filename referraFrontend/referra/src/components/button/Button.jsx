import { Link } from "react-router-dom";

const Button = ({ text, to, onClick, variant = "primary", className = "" }) => {
  const baseClass = variant === "secondary" ? "button-style-2" : "button-style";

  // If onClick is provided, render a button element
  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClass} ${className}`}>
        {text}
      </button>
    );
  }

  // Otherwise, render a Link for navigation
  return (
    <Link to={to} className={`${baseClass} ${className}`}>
      {text}
    </Link>
  );
};

export default Button;
