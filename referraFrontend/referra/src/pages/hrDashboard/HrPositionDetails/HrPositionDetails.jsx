import React from "react";
import { Link } from "react-router-dom";
import "./HrPositionDetails.css";

const HrPositionDetails = () => {
  return (
    <div>
      <Link to="/dashboard/hr/positions">&lt;-</Link>
      <h3>Position Details</h3>
    </div>
  );
};

export default HrPositionDetails;
