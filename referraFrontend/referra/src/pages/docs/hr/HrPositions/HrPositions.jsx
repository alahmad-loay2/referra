import React from "react";
import "./HrPositions.css";

const HrPositions = () => {
  return (
    <div className="hr-positions">
      <h1 className="positions-title">Managing Positions</h1>

      <p className="positions-paragraph">
        HR users can view and manage all positions within their assigned
        departments. Only positions belonging to the HR's departments are
        visible and manageable.
      </p>

      <section className="positions-section">
        <h2>Viewing & Filtering Positions</h2>
        <ul>
          <li>Filter by Position Name</li>
          <li>Filter by Department (only assigned departments)</li>
          <li>Filter by Status (Open / Closed)</li>
        </ul>

        <p className="positions-paragraph">
          By default, HR will see all positions in their departments including:
        </p>

        <ul>
          <li>Position Name</li>
          <li>Company Name</li>
          <li>Department</li>
          <li>Location</li>
          <li>Applicant Count</li>
          <li>Status (Open / Closed)</li>
          <li>Posted Date</li>
        </ul>
        <div className="positions-images">
          <img src="/hrPositionsImg.png" alt="HR Positions List" />
        </div>
      </section>

      <section className="positions-section">
        <h2>Position Actions</h2>
        <ul>
          <li>
            <strong>Close Position:</strong>
            Closes an open position. The position will no longer appear to
            employees. All referrals under this position will be prospected
            automatically.
          </li>

          <li>
            <strong>Open Position:</strong>
            Reopens a closed position. All previously prospected referrals for
            this position will be un-prospected.
          </li>

          <li>
            <strong>View Details:</strong>
            Redirects to the Referrals page and displays all referrals for this
            specific position within the company.
          </li>
        </ul>
      </section>

      <section className="positions-section">
        <h2>Creating a New Position</h2>

        <p className="positions-paragraph">
          HR can create a new position with the following information:
        </p>

        <ul>
          <li>Job Title</li>
          <li>Company Name</li>
          <li>Employment Type</li>
          <li>Years of Experience Required</li>
          <li>Department</li>
          <li>Location</li>
          <li>Timezone</li>
          <li>Application Deadline</li>
          <li>Job Description</li>
        </ul>

        <p className="positions-paragraph">
          When the deadline is reached, the position automatically closes.
        </p>

        <p className="positions-paragraph">
          If an HR reopens a position, the deadline is automatically set to
          <strong> 10 days from the current date</strong>.
        </p>
      </section>

      <section className="positions-section">
        <h2>Editing a Position</h2>

        <p className="positions-paragraph">
          Editing a position allows the HR to modify:
        </p>

        <ul>
          <li>All position information fields</li>
          <li>Application deadline</li>
        </ul>

        <p className="positions-paragraph">
          The edit form contains the same fields as the create position form.
        </p>
      </section>

      <div className="positions-images">
        <img src="/createPositionHr.png" alt="Create Position Form" />
      </div>
    </div>
  );
};

export default HrPositions;
