import React, { useState } from "react";
import "./Docs.css";
import { ChevronDown, ChevronRight } from "lucide-react";

import HrOverview from "./hr/HrOverview/HrOverview.jsx";
import HrReferrals from "./hr/HrReferrals/HrReferrals.jsx";
import HrPositions from "./hr/HrPositions/HrPositions.jsx";
import HrTeam from "./hr/HrTeam/HrTeam.jsx";
import EmpOverview from "./employee/EmpOverview/EmpOverview.jsx";
import EmpReferrals from "./employee/EmpReferrals/EmpReferrals.jsx";
import EmpPositions from "./employee/EmpPositions/EmpPositions.jsx";
import EmpSubmit from "./employee/EmpSubmit/EmpSubmit.jsx";


const Docs = () => {
  const [openSections, setOpenSections] = useState({
    hr: false,
    employee: false,
  });

  const [activePage, setActivePage] = useState(null);

  const hrPages = [
    { id: "hr-overview", title: "Overview" },
    { id: "hr-referrals", title: "Referrals" },
    { id: "hr-positions", title: "Positions" },
    { id: "hr-team", title: "HR Team" },
  ];

  const employeePages = [
    { id: "employee-overview", title: "Overview" },
    { id: "employee-referrals", title: "Referrals" },
    { id: "employee-positions", title: "Positions" },
    { id: "employee-submit", title: "Submit Referral" },
  ];

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePageClick = (pageId) => {
    setActivePage(pageId);
  };

  const pageComponents = {
    "hr-overview": HrOverview,
    "hr-referrals": HrReferrals,
    "hr-positions": HrPositions,
    "hr-team": HrTeam,
    "employee-overview": EmpOverview,
    "employee-referrals": EmpReferrals,
    "employee-positions": EmpPositions,
    "employee-submit": EmpSubmit,
  };

  const ActiveComponent = activePage
    ? pageComponents[activePage]
    : null;

  return (
    <div className="docs-container">
      <div className="docs-sidebar">
        <div className="docs-sidebar-header">
          <h2>Documentation</h2>
        </div>

        <div className="docs-sidebar-content">
          <div className="docs-section">
            <button
              className="docs-section-header"
              onClick={() => toggleSection("hr")}
            >
              {openSections.hr ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
              <span>HR</span>
            </button>

            {openSections.hr && (
              <div className="docs-section-pages">
                {hrPages.map((page) => (
                  <button
                    key={page.id}
                    className={`docs-page-link ${
                      activePage === page.id ? "active" : ""
                    }`}
                    onClick={() => handlePageClick(page.id)}
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="docs-section">
            <button
              className="docs-section-header"
              onClick={() => toggleSection("employee")}
            >
              {openSections.employee ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
              <span>Employee</span>
            </button>

            {openSections.employee && (
              <div className="docs-section-pages">
                {employeePages.map((page) => (
                  <button
                    key={page.id}
                    className={`docs-page-link ${
                      activePage === page.id ? "active" : ""
                    }`}
                    onClick={() => handlePageClick(page.id)}
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="docs-content">
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div className="docs-welcome">
            <h1>Welcome to Documentation</h1>
            <p>Select a section from the sidebar to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Docs;
