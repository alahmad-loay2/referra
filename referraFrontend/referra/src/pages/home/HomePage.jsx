import React from "react";
import { User } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { Calendar } from "lucide-react";
import { Users, CheckCircle2, Zap } from "lucide-react";

import Button from "../../components/button/Button.jsx";
import "./HomePage.css";
import { motion } from "framer-motion";
import HomeComponent from "../../components/cards/HomeComponent.jsx";
// HomePage is the landing page of the application that showcases the main features and benefits of the employee referral system.
// It includes a hero section with a headline, description, and call-to-action button, as well as some key stats and animated cards that highlight the referral process and success stories.
const HomePage = () => {
  return (
    <div className="page">
      <div className="navbar">
        <img src="/logo.svg" alt="Aspire Software" id="logo" />

        <div className="button-group">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="docs-link"
          >
            Docs
          </a>
          <Button text="Sign In" to="/login" variant="secondary" />
          <Button text="Get Started" to="/register" />
        </div>
      </div>
      <div className="parent-content">
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
            <Button
              text={
                <>
                  Start Referring <span className="btn-arrow">→</span>
                </>
              }
              to="/register"
              className="hero-btn"
            />
            <div className="stats">
              <div className="stat-item">
                <div className="stat-icon icon-blue">
                  <Users size={18} />
                </div>
                <div>
                  <strong>500+</strong>
                  <span>Referrals Made</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon icon-green">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong>85%</strong>
                  <span>Success Rate</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon icon-yellow">
                  <Zap size={18} />
                </div>
                <div>
                  <strong>3×</strong>
                  <span>Faster Hiring</span>
                </div>
              </div>
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
    </div>
  );
};

export default HomePage;
