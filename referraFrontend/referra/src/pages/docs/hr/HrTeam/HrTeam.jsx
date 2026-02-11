import React from "react";
import "./HrTeam.css";

const HrTeam = () => {
  return (
    <div className="hr-team">
      <h1 className="team-title">HR Team Management</h1>

      <p className="team-paragraph">
        HR users can manage other HR members within the system. This section
        allows viewing existing members and adding new HR users.
      </p>

      <section className="team-section">
        <h2>Viewing HR Members</h2>

        <p className="team-paragraph">
          By default, HR can view all HR members along with the following
          information:
        </p>

        <ul>
          <li>Full Name</li>
          <li>Email Address</li>
          <li>Phone Number</li>
          <li>Assigned Departments</li>
          <li>Date Joined</li>
        </ul>
        <div className="team-images">
          <img src="/HrTeam.png" alt="HR Team List" />
        </div>
      </section>

      <section className="team-section">
        <h2>Searching & Filtering</h2>

        <p className="team-paragraph">
          HR can search through team members using:
        </p>

        <ul>
          <li>Name</li>
          <li>Email</li>
          <li>Department</li>
        </ul>
      </section>

      <section className="team-section">
        <h2>Adding a New HR Member</h2>

        <p className="team-paragraph">
          The only available action in this section is adding a new HR member.
        </p>

        <p className="team-paragraph">
          When creating a new HR, the following information must be provided:
        </p>

        <ul>
          <li>Full Name</li>
          <li>Email Address</li>
          <li>Assigned Departments</li>
          <li>Age</li>
          <li>Phone Number</li>
          <li>Gender</li>
        </ul>

        <p className="important-note">
          ⚠ IMPORTANT: After being added, the new HR member must reset their
          password in order to activate and access their account.
        </p>
      </section>

      <div className="team-images">
        <img src="/AddHrMember.png" alt="Add HR Member Form" />
      </div>
    </div>
  );
};

export default HrTeam;
