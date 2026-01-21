import { motion } from "framer-motion";
import "../../pages/home/HomePage.css";

const HomeComponent = ({
  title,
  description,
  icon,
  delay = 0,
  iconClass = "",
}) => {
  return (
    <motion.div
      className="card"
      animate={{ x: [0, 16, 0] }}
      transition={{
        duration: 6,
        ease: "easeInOut",
        repeat: Infinity,
        delay: delay,
      }}
      whileHover={{
        scale: 1.03,
        boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
      }}
    >
      <div className={`icon-circle ${iconClass}`}>{icon}</div>
      <div className="card-text">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </motion.div>
  );
};

export default HomeComponent;
