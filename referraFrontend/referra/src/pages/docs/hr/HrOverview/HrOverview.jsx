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
        <h2>Admin HR</h2>
        <p className="hr-paragraph">
          Admin HR users have additional permissions. In addition to the standard HR actions above, they can create and manage departments for the organization.
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
