import { Link } from "react-router-dom";

const Button = ({ text, to, variant = "primary" }) => {
  const className = variant === "secondary" ? "button-style-2" : "button-style";

  return (
    <Link to={to} className={className}>
      {text}
    </Link>
  );
};

export default Button;
