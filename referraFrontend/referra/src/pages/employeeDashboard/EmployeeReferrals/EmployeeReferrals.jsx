import React from "react";
import { Search, Mail, Calendar, Briefcase, Check } from "lucide-react";
import { fetchEmployeeApplications } from "../../../api/employee.api";
import "./EmployeeReferrals.css";
const STATUS_ORDER = [
  "Pending",
  "Confirmed",
  "InterviewOne",
  "InterviewTwo",
  "Acceptance",
];

const PAGE_SIZE = 4;

const EmployeeReferrals = () => {
  const [referrals, setReferrals] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [totalPages, setTotalPages] = React.useState(1);
  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const goNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const goPrev = () => {
    if (page > 1) setPage(page - 1);
  };
  const getVisiblePages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  React.useEffect(() => {
    setLoading(true);

    fetchEmployeeApplications({
      page,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        setReferrals(res.applications || []);
        setTotal(res.totalReferrals || 0);
        setTotalPages(res.totalPages || 1);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page]);

  return (
    <div className="referrals-container">
      <div className="referrals-header">
        <h1>My Referrals</h1>

        <div className="referrals-filters">
          <div className="searchInWrap">
            <input type="text" placeholder="Name" />
            <Search className="searchIcon" size={16} />
          </div>

          <div className="selectCon">
            <select>
              <option>Status</option>
            </select>
            <input type="date" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading your referrals…</div>
      ) : (
        <p className="results-info">
          Showing {Math.min(page * PAGE_SIZE, total)} out of {total} candidates
        </p>
      )}

      <div className="referrals-list">
        {referrals.map((ref) => {
          const { Referral, Candidate, Position } = ref;
          const status = Referral.Status;
          const createdAt = Referral.CreatedAt;

          const currentIndex = STATUS_ORDER.indexOf(status);

          return (
            <div key={Referral.ReferralId} className="referral-card">
              <div className="referral-left">
                <div className="avatar">
                  {Candidate.FirstName[0]}
                  {Candidate.LastName[0]}
                </div>

                <div className="referral-info">
                  <h3>
                    {Candidate.FirstName} {Candidate.LastName}
                  </h3>

                  <div className="meta">
                    <span className="meta-item">
                      <Mail size={14} />
                      {Candidate.Email}
                    </span>

                    <span className="meta-item">
                      <Briefcase size={14} />
                      {Position.PositionTitle}
                    </span>

                    <span className="meta-item">
                      <Calendar size={14} />
                      {new Date(createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* TIMELINE */}
                  <div className="timeline">
                    {STATUS_ORDER.map((step, index) => {
                      const isDone = index < currentIndex;
                      const isActive = index === currentIndex;

                      return (
                        <React.Fragment key={step}>
                          <div
                            className={`step ${
                              isDone ? "done" : ""
                            } ${isActive ? "active" : ""}`}
                          >
                            <span className="icon">
                              {isDone && <Check size={14} />}
                              {isActive && <Briefcase size={14} />}
                            </span>
                            <span className="label">{step}</span>
                          </div>

                          {index < STATUS_ORDER.length - 1 && (
                            <div
                              className={`line ${
                                isDone ? "done" : isActive ? "active" : ""
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="referral-right">
                <button className="details-btn">View Details</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pagination">
        <button className="nav" onClick={goPrev} disabled={page === 1}>
          ← Previous
        </button>

        {getVisiblePages().map((p) => (
          <button
            key={p}
            className={p === page ? "active" : ""}
            onClick={() => goToPage(p)}
          >
            {p}
          </button>
        ))}

        <button className="nav" onClick={goNext} disabled={page === totalPages}>
          Next →
        </button>
      </div>
    </div>
  );
};

export default EmployeeReferrals;
