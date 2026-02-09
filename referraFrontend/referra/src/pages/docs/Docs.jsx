import React, { useState } from "react";
import "./Docs.css";
import { ChevronDown, ChevronRight } from "lucide-react";

const Docs = () => {
  const [openSections, setOpenSections] = useState({
    hr: false,
    employee: false,
  });
  const [activePage, setActivePage] = useState(null);

  // HR Documentation Pages
  const hrPages = [
    { id: "hr-overview", title: "Overview" },
    { id: "hr-dashboard", title: "Dashboard" },
    { id: "hr-referrals", title: "Managing Referrals" },
    { id: "hr-positions", title: "Positions" },
    { id: "hr-team", title: "HR Team" },
  ];

  // Employee Documentation Pages
  const employeePages = [
    { id: "employee-overview", title: "Overview" },
    { id: "employee-dashboard", title: "Dashboard" },
    { id: "employee-submit", title: "Submitting Referrals" },
    { id: "employee-positions", title: "Open Positions" },
    { id: "employee-referrals", title: "My Referrals" },
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

  // Content mapping - Easy to add new pages here
  const getPageContent = (pageId) => {
    const contentMap = {
      "hr-overview": {
        title: "HR Overview",
        content: "Welcome to the HR documentation. This section covers everything HR users need to know about managing the referral system.",
      },
      "hr-dashboard": {
        title: "HR Dashboard",
        content: "The HR Dashboard provides an overview of all referrals, positions, and team members. Use the navigation sidebar to access different sections.",
      },
      "hr-referrals": {
        title: "Managing Referrals",
        content: "Learn how to view, filter, and manage employee referrals. You can see referral status, candidate details, and take actions on each referral.",
      },
      "hr-positions": {
        title: "Positions",
        content: "Create and manage open positions. Set deadlines, requirements, and track the status of each position.",
      },
      "hr-team": {
        title: "HR Team",
        content: "Manage your HR team members. Add new HR users, view team statistics, and manage permissions.",
      },
      "employee-overview": {
        title: "Employee Overview",
        content: "Welcome to the Employee documentation. This section covers everything employees need to know about using the referral system.",
      },
      "employee-dashboard": {
        title: "Employee Dashboard",
        content: "Your dashboard shows your referral statistics, recent activity, and quick access to submit new referrals.",
      },
      "employee-submit": {
        title: "Submitting Referrals",
        content: "Learn how to submit referrals for open positions. Fill in candidate information, upload CVs, and track your referral status.",
      },
      "employee-positions": {
        title: "Open Positions",
        content: "Browse available positions and see which ones you can refer candidates for. Click on any position to view details.",
      },
      "employee-referrals": {
        title: "My Referrals",
        content: "View all your submitted referrals, their current status, and track the progress of each candidate through the hiring process.",
      },
    };

    return contentMap[pageId] || {
      title: "Page Not Found",
      content: "This documentation page is coming soon.",
    };
  };

  const currentContent = activePage ? getPageContent(activePage) : null;

  return (
    <div className="docs-container">
      <div className="docs-sidebar">
        <div className="docs-sidebar-header">
          <h2>Documentation</h2>
        </div>

        <div className="docs-sidebar-content">
          {/* HR Section */}
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

          {/* Employee Section */}
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
        {currentContent ? (
          <>
            <h1>{currentContent.title}</h1>
            <div className="docs-content-body">
              <p>{currentContent.content}</p>
              {/* Add more content here as needed */}
            </div>
          </>
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
