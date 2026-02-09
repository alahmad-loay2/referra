import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle,
  Clock,
  DollarSign,
  Briefcase,
  Mail,
} from "lucide-react";
import { getEmployeeDashboard } from "../../../api/employeeDashboard.api.js";
import Loading from "../../../components/loading/Loading.jsx";

import "./EmployeeDashboardHome.css";

const EmployeeDashboardHome = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const handleOpenReferralDetails = (referralId) => {
    if (!referralId) return;
    navigate(`/dashboard/employee/referral-history/${referralId}`);
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getEmployeeDashboard();
        setDashboard(data);
      } catch (err) {
        console.error("Failed to load employee dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);
  const handleOpenPositionDetails = (positionId) => {
    if (!positionId) return;
    navigate(`/dashboard/employee/open-positions/${positionId}`);
  };

  return (
    <div className="emp-dashboard-home">
      {/* STATS */}
      <div className="emp-dashboard-stats">
        <StatCard
          icon={<Users size={16} />}
          label="Total referrals"
          value={dashboard?.stats.totalReferrals}
          extra="All time"
          loading={loading}
        />
        <StatCard
          icon={<CheckCircle size={16} />}
          label="Successful hires"
          value={dashboard?.stats.successfulHires}
          extra="Hired"
          loading={loading}
        />
        <StatCard
          icon={<Clock size={16} />}
          label="Pending reviews"
          value={dashboard?.stats.pendingReviews}
          extra="In progress"
          loading={loading}
        />
        <StatCard
          icon={<DollarSign size={16} />}
          label="Bonuses earned"
          value={`$${dashboard?.stats.earnedBonuses || 0}`}
          extra="In total"
          loading={loading}
        />
      </div>

      {/* SECTIONS */}
      <div className="emp-dashboard-sections">
        {/* RECENT REFERRALS */}
        <div className="emp-dashboard-section">
          <div className="emp-section-header">
            <h2>Recent Referrals</h2>
            <Link to="/dashboard/employee/my-referrals">View all</Link>
          </div>

          {loading
            ? [...Array(3)].map((_, i) => <ReferralSkeleton key={i} />)
            : dashboard?.recentReferrals?.map((ref) => (
                <div
                  key={ref.Referral.ReferralId}
                  className="emp-referral-card"
                >
                  <div className="emp-referral-left">
                    <div className="emp-avatar">
                      {ref.Candidate.FirstName[0]}
                      {ref.Candidate.LastName[0]}
                    </div>

                    <div className="emp-referral-info">
                      <p className="emp-name">
                        {ref.Candidate.FirstName} {ref.Candidate.LastName}
                      </p>

                      <span className="emp-meta">
                        <Mail size={14} />
                        <span className="emp-meta-text">
                          {ref.Candidate.Email}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="emp-card-right">
                    <button
                      type="button"
                      className="emp-referral-details-btn"
                      onClick={() =>
                        handleOpenReferralDetails(ref.Referral.ReferralId)
                      }
                    >
                      Referral Details
                    </button>
                  </div>
                </div>
              ))}
        </div>

        {/* OPEN POSITIONS */}
        <div className="emp-dashboard-section">
          <div className="emp-section-header">
            <h2>Open positions</h2>
            <Link to="/dashboard/employee/open-positions">View all</Link>
          </div>

          {loading
            ? [...Array(3)].map((_, i) => <PositionSkeleton key={i} />)
            : dashboard?.recentPositions?.map((pos) => (
                <div key={pos.PositionId} className="emp-position-card">
                  <div className="emp-referral-left">
                    <div className="emp-avatar">
                      <Briefcase size={16} />
                    </div>

                    <div className="emp-referral-info">
                      <p className="emp-name">{pos.PositionTitle}</p>
                      <span className="emp-meta">
                        {pos.Department.DepartmentName}
                      </span>
                    </div>
                  </div>

                  <div className="emp-card-right">
                    <button
                      type="button"
                      className="emp-referral-details-btn"
                      onClick={() => handleOpenPositionDetails(pos.PositionId)}
                    >
                      Position Details
                    </button>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- SMALL COMPONENTS ---------- */

const StatCard = ({ icon, label, value, extra, loading }) => (
  <div className="emp-dashboard-stat">
    <div className="emp-stat-header">
      <div className="emp-icon">{icon}</div>
      <p>{label}</p>
    </div>

    <span className="emp-stat-value">
      {loading ? (
        <Loading small />
      ) : (
        <>
          {value ?? 0}
          <span className="emp-extra">{extra}</span>
        </>
      )}
    </span>
  </div>
);

const ReferralSkeleton = () => (
  <div className="emp-skeleton-card">
    <div className="emp-skeleton-left">
      <div className="emp-skeleton-avatar" />
      <div className="emp-skeleton-lines">
        <div className="emp-skeleton-line large" />
        <div className="emp-skeleton-line small" />
      </div>
    </div>
    <div className="emp-skeleton-button" />
  </div>
);

const PositionSkeleton = () => (
  <div className="emp-skeleton-card">
    <div className="emp-skeleton-left">
      <div className="emp-skeleton-avatar" />
      <div className="emp-skeleton-lines">
        <div className="emp-skeleton-line large" />
        <div className="emp-skeleton-line small" />
      </div>
    </div>
  </div>
);

export default EmployeeDashboardHome;
