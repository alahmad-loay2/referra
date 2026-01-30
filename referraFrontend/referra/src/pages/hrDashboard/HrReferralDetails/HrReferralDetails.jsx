import React from "react";
import { Link } from "react-router-dom";
import "./HrReferralDetails.css";

const HrReferralDetails = () => {
  return (
    <div>
      <Link to="/dashboard/hr/referrals">&lt;-</Link>
      <h3>Referral Details</h3>
    </div>
  );
};

export default HrReferralDetails;
