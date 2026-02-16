import React from "react";
import "./HrOverview.css"; 

const HrOverview = () => {
  return (
    <div className="hr-overview">
      <h1 className="hr-title">HR Overview</h1>

      <p className="hr-paragraph">
        The HR role is created by an Admin or an existing HR member. Each HR
        user is assigned to one or more departments, and their permissions are
        limited to managing referrals and positions within those departments.
      </p>

      <section className="hr-section">
        <h2>What HR Can Do</h2>
        <ul className="hr-list">
          <li>View confirmed referrals within their assigned departments.</li>
          <li>Prospect candidates</li>
          <li> move a referred candidate forward in the hiring process.</li>
          <li>Create and manage positions within their departments.</li>
          <li>Accept or reject referrals.</li>
          <li>Compensate employees when a referred candidate is successfully hired.</li>
          <li>Create and view HR team members.</li>
        </ul>
      </section>

      <section className="hr-section">
        <h2>Switching to Employee Account</h2>
        <p className="hr-paragraph">
          HR users can switch to an employee account view at any time. When switched to employee mode, HR users have full access to all employee features, including:
        </p>
        <ul className="hr-list">
          <li>Viewing open positions across all departments</li>
          <li>Submitting referrals for candidates</li>
          <li>Tracking their own referral history and status</li>
          <li>Editing candidate information for their referrals</li>
          <li>Viewing referral details and progress</li>
        </ul>
        <p className="hr-paragraph">
          This allows HR team members to participate in the referral program just like any other employee, while still maintaining their HR management capabilities when switched back to HR view.
        </p>
      </section>

      <section className="hr-section">
        <h2>Admin HR</h2>
        <p className="hr-paragraph">
          There are two types of HR users: regular HR and Admin HR (Created with bootstrap API). Admin HR users have additional permissions beyond standard HR capabilities.
        </p>
        <p className="hr-paragraph">
          <strong>Admin HR Additional Permissions:</strong>
        </p>
        <ul className="hr-list">
          <li>Create and manage departments for the organization (accessible from the HR Team page)</li>
        </ul>
        <p className="hr-paragraph">
          For now, creating departments is the primary additional capability of Admin HR users. All other HR features remain the same for both regular and Admin HR users.
        </p>
      </section>

      <section className="hr-section">
        <h2>Referral Flow</h2>
        <p className="hr-paragraph">
          Employees can refer candidates to open positions. A candidate may be
          referred multiple times, but never to the same position more than once.
        </p>

        <p className="hr-paragraph">
          When a candidate is referred, they must first confirm their referral.
          Only after confirmation does the candidate become visible to HR for
          review and action.
        </p>
      </section>

      <section className="hr-section">
        <h2>What HR Has No Control Over</h2>
        <ul className="hr-list">
          <li>
            Employees can edit candidate information. Any changes update all
            referrals linked to that candidate.
          </li>
          <li>
            HR cannot see unconfirmed referrals. Candidates must confirm before
            appearing in the HR dashboard.
          </li>
          <li>
            Employees may refer the same candidate to different positions, but
            duplicate referrals to the same position are prevented by the system.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default HrOverview;
