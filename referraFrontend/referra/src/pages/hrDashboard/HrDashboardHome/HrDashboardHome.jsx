import React, { useEffect, useState } from "react";
import { getHrDashboard } from "../../../api/hrPositions.api.js";
import { Users, Briefcase, Clock, CheckCircle } from "lucide-react";
import "./HrDashboardHome.css";

const HrDashboardHome = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

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

      <div>
        <h2>Recent Referrals</h2>
        <div className="hr-dashboard-home-recent-referrals">
          {dashboardData?.recentReferrals.map((referral) => (
            <div className="hr-dashboard-home-recent-referral" key={referral.ApplicationId}>
              <p>{referral.Candidate.FirstName} {referral.Candidate.LastName}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrDashboardHome;

