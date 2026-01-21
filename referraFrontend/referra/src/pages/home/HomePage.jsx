import React from "react";
import { User } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { Calendar } from "lucide-react";

import HomeComponent from "../../components/HomeComponent.jsx";
import Button from "../../components/Button.jsx";
import "./HomePage.css";
import { motion } from "framer-motion";

const HomePage = () => {
  return (
    <div className="page">
      <div className="navbar">
        <img src="/logo.svg" alt="Aspire Software" id="logo" />
        <Button text="Sign In" to="/login" />
      </div>

      <div className="content">
        <div className="left-section">
          <div className="badge">
            <motion.span
              className="badge-dot"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span className="badge-text">Streamline your hiring process</span>
          </div>

          <h1>
            Employee Referrals,
            <br /> <span className="highlight">Simplified</span>
          </h1>

          <p>
            Transform your referral process from chaotic email threads to a
            streamlined system. Employees submit, candidates confirm, HR
            processes—all in one place.
          </p>
          <div className="button-group">
            <Button text="Get Started" to="/register" />
            <Button text="HR dashboard" to="/login" variant="secondary" />
          </div>
        </div>
        <div className="right-section">
          <div className="card-wrapper">
            <HomeComponent
              icon={<User />}
              title="Referral Submitted"
              description="John referred Sarah for Senior Developer"
              delay={0}
            />
          </div>
          <div className="card-wrapper shifted">
            <HomeComponent
              icon={<CheckCircle />}
              title="Candidate Hired"
              description="$2,500 bonus awarded"
              delay={1}
              iconClass="icon-green"
            />
          </div>
          <div className="card-wrapper">
            <HomeComponent
              icon={<Calendar />}
              title="Interview Scheduled"
              description="Round 2 with Engineering Team"
              delay={2}
              iconClass="icon-yellow"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
