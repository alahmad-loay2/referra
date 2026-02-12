import React from "react";
import "./EmpReferrals.css";

const EmpReferrals = () => {
  return (
    <div className="emp-referrals">
      <h1 className="referrals-title">My Referrals</h1>

      <p className="referrals-paragraph">
        Employees can view all their submitted referrals. By default, all referrals are displayed if no filters are applied.
      </p>

      <section className="referrals-section">
        <h2>Filtering & Searching</h2>
        <ul>
          <li>Search by candidate name or email.</li>
          <li>Filter by status: Pending, Confirmed, Interview One, Interview Two, Acceptance, or Hired.</li>
          <li>Filter by date referred.</li>
        </ul>
      </section>

      <section className="referrals-section">
        <h2>Default Referral View</h2>
        <ul>
          <li>Candidate Name</li>
          <li>Email</li>
          <li>Position applied for</li>
          <li>Referral Date</li>
          <li>Timeline showing status and Prospect badge if applicable</li>
          <li>Button to view Referral Details</li>
        </ul>

        <div className="referrals-images">
          <img src="EmpReferrals.png" alt="Employee Referrals Overview" />
        </div>
      </section>

      <section className="referrals-section">
        <h2>Referral Details View</h2>
        <p className="referrals-paragraph">
          When opening referral details, employees can see:
        </p>
        <ul>
          <li>Timeline of referral status (Pending → Confirmed → Interview One → Interview Two → Acceptance → Hired)</li>
          <li>Position details:</li>
          <ul className="nested-list">
            <li>Position Name</li>
            <li>Years of Experience Required</li>
            <li>Company Name</li>
            <li>Timezone</li>
            <li>Location</li>
            <li>Deadline</li>
            <li>Status (Open/Closed)</li>
            <li>Employment Type (Full-time, Part-time, Intern)</li>
            <li>Description</li>
          </ul>
          <li>Candidate information:</li>
          <ul className="nested-list">
            <li>Full Name</li>
            <li>Email</li>
            <li>Phone Number</li>
            <li>Years of Experience</li>
            <li>CV</li>
            <li>Referral can be edited anytime</li>
            <li>Delete referral only if in Pending status</li>
          </ul>
        </ul>

        <div className="referrals-images">
          <img src="EmpReferralsDetails.png" alt="Employee Referral Details" />
        </div>
      </section>
    </div>
  );
};

export default EmpReferrals;
