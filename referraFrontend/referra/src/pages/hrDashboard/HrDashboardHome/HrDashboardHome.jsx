import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getHrDashboard } from "../../../api/hrPositions.api.js";
import { Users, Briefcase, Clock, CheckCircle, Mail, Calendar } from "lucide-react";
import "./HrDashboardHome.css";

const HrDashboardHome = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getHrDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch HR dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleSearchCandidate = (fullName) => {
    if (!fullName) return;
    const params = new URLSearchParams();
    params.set("search", fullName);
    navigate(`/dashboard/hr/referrals?${params.toString()}`);
  };

  return (
    <div className="hr-dashboard-home">
      <div className="hr-dashboard-home-header">
        <div className="hr-dashboard-home-header-item">
          <div className="hr-dashboard-home-icon-label">
            <div className="hr-dashboard-home-icon-wrapper">
              <Users size={16} />
            </div>
            <p>Total Referrals</p>
          </div>
          <span>{dashboardData?.totalReferrals} <span className="hr-dashboard-home-header-item-extra">Total Referrals</span></span>
        </div>
        <div className="hr-dashboard-home-header-item">
          <div className="hr-dashboard-home-icon-label">
            <div className="hr-dashboard-home-icon-wrapper">
              <Briefcase size={16} />
            </div>
            <p>Open Positions</p>
          </div>
          <span>{dashboardData?.openPositions} <span className="hr-dashboard-home-header-item-extra">In your departments</span></span>
        </div>
        <div className="hr-dashboard-home-header-item">
          <div className="hr-dashboard-home-icon-label">
            <div className="hr-dashboard-home-icon-wrapper">
              <Clock size={16} />
            </div>
            <p>Pending Reviews</p>
          </div>
          <span>{dashboardData?.pendingReviews} <span className="hr-dashboard-home-header-item-extra">Pending Referrals</span></span>
        </div>
        <div className="hr-dashboard-home-header-item">
          <div className="hr-dashboard-home-icon-label">
            <div className="hr-dashboard-home-icon-wrapper">
              <CheckCircle size={16} />
            </div>
            <p>Successful Hires</p>
          </div>
          <span>{dashboardData?.successfulHires} <span className="hr-dashboard-home-header-item-extra">Hired</span></span>
        </div>
      </div>

      <div className="hr-dashboard-home-recent-section">
        <div className="hr-dashboard-home-recent-referrals">
          <div className="hr-dashboard-home-recent-header">
            <h2>Recent Referrals</h2>
            <Link to="/dashboard/hr/referrals" className="hr-dashboard-home-view-all">
              View all
            </Link>
          </div>
          {loading ? (
            <>
              {[...Array(3)].map((_, index) => (
                <div key={`skeleton-${index}`} className="hr-dashboard-home-candidate-skeleton">
                  <div className="hr-dashboard-home-skeleton-card-left">
                    <div className="hr-dashboard-home-recent-avatar-name-skeleton">
                      <div className="hr-dashboard-home-recent-avatar-skeleton"></div>
                      <div className="hr-dashboard-home-skeleton-name"></div>
                    </div>
                    <div className="hr-dashboard-home-skeleton-email"></div>
                  </div>
                  <div className="hr-dashboard-home-skeleton-card-right">
                    <div className="hr-dashboard-home-skeleton-text-small"></div>
                    <div className="hr-dashboard-home-skeleton-text-small"></div>
                    <div className="hr-dashboard-home-skeleton-text-small"></div>
                    <div className="hr-dashboard-home-skeleton-button"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            dashboardData?.recentReferrals?.map((referral) => {
              const fullName = `${referral.Candidate.FirstName} ${referral.Candidate.LastName}`;
              return (
                <div
                  className="candidate"
                  key={referral.ApplicationId}
                >
                  <div className="cardLeft">
                    <div className="hr-dashboard-home-recent-avatar-name">
                      <div className="hr-dashboard-home-recent-avatar">
                        {referral.Candidate.FirstName?.[0]}
                        {referral.Candidate.LastName?.[0]}
                      </div>
                      <p>{fullName}</p>
                    </div>
                    <span className="iconText">
                      <Mail size={14} />
                      <span className="iconTextLabel">{referral.Candidate.Email}</span>
                    </span>
                    {referral.Position?.PositionTitle && (
                      <span className="iconText">
                        <Briefcase size={14} />
                        <span className="iconTextLabel">{referral.Position.PositionTitle}</span>
                      </span>
                    )}
                  </div>
                  <div className="cardRight">
                    {referral.Referral?.Status && (
                      <span className="iconText">
                        <Clock size={14} />
                        <span className="iconTextLabel">{referral.Referral.Status}</span>
                      </span>
                    )}
                    {referral.Referral?.CreatedAt && (
                      <span className="iconText">
                        <Calendar size={14} />
                        <span className="iconTextLabel">
                          {new Date(referral.Referral.CreatedAt).toLocaleDateString("en-CA", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </span>
                      </span>
                    )}
                    <button
                      type="button"
                      className="referral-details-btn"
                      onClick={() => handleSearchCandidate(fullName)}
                    >
                      Search candidate
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default HrDashboardHome;

