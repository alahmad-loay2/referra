import React from "react";
import "./HrReferrals.css";

const HrReferrals = () => {
  return (
    <div className="hr-referrals">
      <h1 className="referrals-title">Managing Referrals</h1>

      <p className="referrals-paragraph">
        HR users can view and manage all referrals within their assigned
        departments. By default, if no filters are applied, all referrals from
        the HR's departments are displayed automatically.
      </p>

      <section className="referrals-section">
        <h2>Filtering & Searching</h2>
        <ul>
          <li>Search by candidate name or email.</li>
          <li>Filter by position.</li>
          <li>Filter by referral date.</li>
          <li>Filter by status:</li>
          <ul className="nested-list">
            <li>Confirmed</li>
            <li>Interview 1</li>
            <li>Interview 2</li>
            <li>Acceptance Stage (final stage before decision)</li>
            <li>Hired</li>
          </ul>
        </ul>
      </section>

      <section className="referrals-section">
        <h2>Default Referral View</h2>
        <p className="referrals-paragraph">HR will see:</p>
        <ul>
          <li>Candidate Name</li>
          <li>Email</li>
          <li>
            Candidate state (In Progress, Prospected, Hired, Accepted in other position)
          </li>
          <li>Referral status (Confirmed, Interview1, Interview2, Acceptance, Hired)</li>
          <li>Position applied for</li>
          <li>Button to view Referral Details</li>
        </ul>

        <div className="referrals-images">
          <img src="/referralImg.png" alt="Referral List View" />
        </div>
      </section>

      <section className="referrals-section">
        <h2>Referral Details View</h2>
        <p className="referrals-paragraph">
          When opening referral details, HR can see:
        </p>
        <ul>
          <li>Application progress timeline</li>
          <li>Full candidate information:</li>
          <ul className="nested-list">
            <li>Full Name</li>
            <li>Email</li>
            <li>Phone Number</li>
            <li>Years of Experience</li>
            <li>CV</li>
          </ul>
          <li>Position details</li>
          <li>Employee details (who referred the candidate)</li>
        </ul>
      </section>

      <section className="referrals-section">
        <h2>HR Actions</h2>
        <ul>
          <li>Prospect (Reject) a candidate at any stage.</li>
          <li>
            Move candidate forward (e.g., Interview 1 → Interview 2 → Acceptance
            Stage).
          </li>
          <li>Accept candidate in the Acceptance Stage.</li>
        </ul>
      </section>

      <div className="referrals-images">
        <img src="/referralDetailsHr.png" alt="Referral Details View" />
      </div>
    </div>
  );
};

export default HrReferrals;
