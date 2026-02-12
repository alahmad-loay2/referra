import React from "react";
import "./EmpSubmit.css";

const EmpSubmit = () => {
  return (
    <div className="emp-submit">
      <h1 className="submit-title">Submit a Referral</h1>

      <p className="submit-paragraph">
        Employees can submit referrals for open positions. Pick a position to see its details and then fill in the candidate information.
      </p>

      <section className="submit-section">
        <h2>Position Details</h2>
        <ul>
          <li>Position Name</li>
          <li>Company Name</li>
          <li>+ basic position details</li>
        </ul>

        <div className="submit-images">
          <img src="/SubmitReferral.png" alt="Submit Referral Form" />
        </div>
      </section>

      <section className="submit-section">
        <h2>Candidate Details</h2>
        <ul>
          <li>First Name</li>
          <li>Last Name</li>
          <li>Phone Number</li>
          <li>Total Years of Experience</li>
          <li>Email</li>
          <li>Upload CV</li>
          <li>
            If the email matches an existing candidate, you can autofill the rest of the candidate information.
          </li>
          <li>
            Editing candidate information updates all referrals associated with that candidate.
          </li>
        </ul>

        <div className="important-note">
          HR will only ever see this referral once the candidate confirms from their email.
        </div>
      </section>

      <section className="submit-section">
        <h2>After Submission</h2>
        <ul>
          <li>You can track this referral in <strong>My Referrals</strong>.</li>
          <li>Ensure all information is correct before submitting.</li>
        </ul>
      </section>
    </div>
  );
};

export default EmpSubmit;
