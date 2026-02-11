import React from "react";
import "./EmpOverview.css";

const EmpOverview = () => {
  return (
    <div className="emp-overview">

      <h1 className="emp-title">Employee Overview</h1>

      <div className="emp-section">
        <p className="emp-paragraph">
          When you sign up, you are automatically registered as an Employee. 
          Your role allows you to refer candidates to open positions and track your referrals within the system.
        </p>
      </div>

      <div className="emp-section">
        <h2>What Employees Can Do</h2>
        <ul className="emp-list">
          <li><strong>View Positions:</strong> Browse all open positions available for referral.</li>
          <li><strong>Submit Referrals:</strong> Refer candidates for positions. You can submit multiple referrals, but not for the same candidate for the same position.</li>
          <li><strong>Track Referrals:</strong> Monitor the status of your referrals, including progress through interviews, acceptance, and hiring.</li>
          <li><strong>Edit Candidate Information:</strong> You can edit the information of candidates you referred. Updates apply to all referrals associated with that candidate.</li>
          <li><strong>Compensation:</strong> You can be compensated for referrals that are successfully hired.</li>
        </ul>
      </div>

      <div className="emp-section">
        <h2>Referral Flow</h2>
        <ul className="emp-list">
          <li>Employees can refer candidates to open positions. A candidate may be referred multiple times, but never to the same position more than once.</li>
          <li>Once a candidate is referred, HR will review and take actions such as prospecting, moving forward in interviews, or accepting the referral.</li>
        </ul>
      </div>

      <div className="emp-section">
        <h2>What Employees Have No Control Over</h2>
        <ul className="emp-list">
          <li>HR manages confirmed referrals and decides on progression through the hiring stages.</li>
          <li>Employees cannot override HR decisions regarding prospects, acceptance, or hiring.</li>
          <li>HR may create positions and manage referrals; employees cannot modify positions or HR settings.</li>
        </ul>
      </div>

      <div className="emp-section">
        <p className="emp-paragraph">
          These sections help you understand your role, your permissions, and how referrals flow through the system.
        </p>
      </div>

    </div>
  );
};

export default EmpOverview;
