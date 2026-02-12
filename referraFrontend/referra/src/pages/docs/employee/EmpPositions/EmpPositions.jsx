import React from "react";
import "./EmpPositions.css";

const EmpPositions = () => {
  return (
    <div className="emp-positions">
      <h1 className="positions-title">Available Positions</h1>

      <p className="positions-paragraph">
        Employees can view all available positions in the system. By default, all positions that aren't closed are displayed.
      </p>

      <section className="positions-section">
        <h2>Position Overview</h2>
        <ul>
          <li>Position Name</li>
          <li>Company Name</li>
          <li>Department</li>
          <li>Position Type (Internship, Full-time, Part-time)</li>
          <li>Date Opened</li>
          <li>Button to view Position Details</li>
        </ul>

        <div className="positions-images">
          <img src="/EmpPositions.png" alt="Employee Positions Overview" />
        </div>
      </section>

      <section className="positions-section">
        <h2>Position Details</h2>
        <ul>
          <li>Position Name</li>
          <li>Company Name</li>
          <li>Department</li>
          <li>Job Type (Internship, Full-time, Part-time)</li>
          <li>Years of Experience Required</li>
          <li>Location</li>
          <li>Position Timezone</li>
          <li>Deadline (automatically closes when reached)</li>
          <li>Job Description</li>
          <li>Button to refer candidate: <span>This button takes you to submit referral page and autofills the opened position</span></li>
        </ul>

        <div className="positions-images">
          <img src="/EmpPositionDetails.png" alt="Employee Position Details" />
        </div>
      </section>
    </div>
  );
};

export default EmpPositions;
