import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase } from "lucide-react";
import { getPositionDetails } from "../../../api/positions.api";
import Button from "../../../components/button/Button";

import "./EmployeePositionDetails.css";

const formatEnum = (value) =>
  value
    ?.toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const EmployeePositionDetails = () => {
  const { positionId } = useParams();
  const navigate = useNavigate();

  const [position, setPosition] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    getPositionDetails(positionId)
      .then((res) => {
        if (!res?.error) setPosition(res);
      })
      .finally(() => setLoading(false));
  }, [positionId]);

  if (loading) {
    return <div className="position-details-container">Loading...</div>;
  }

  if (!position) {
    return <div className="position-details-container">Position not found</div>;
  }
  return (
    <div className="position-details-container">
      {/* Header */}
      <div className="position-details-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <h1>Position Details</h1>
      </div>

      {/* Card */}
      <div className="position-details-card">
        {/* Title */}
        <div className="position-title-row">
          <div className="position-icon">
            <Briefcase size={18} />
          </div>

          <div className="title-group">
            <h2>{position.PositionTitle}</h2>
            <span className="company-name">
              Company: {position.CompanyName}
            </span>
          </div>
        </div>

        {/* Info grid */}
        <div className="position-info-grid">
          <div className="info-box">
            <span className="label">Department</span>
            <span className="value">{position.Department.DepartmentName}</span>
          </div>

          <div className="info-box">
            <span className="label">Location</span>
            <span className="value">{position.PositionLocation}</span>
          </div>

          <div className="info-box">
            <span className="label">Job Type</span>
            <span className="value">{formatEnum(position.EmploymentType)}</span>
          </div>

          <div className="info-box">
            <span className="label">Years Of Experience needed</span>
            <span className="value">{position.YearsRequired}+</span>
          </div>

          <div className="info-box">
            <span className="label">Position Time Zone</span>
            <span className="value">{position.Timezone}</span>
          </div>

          <div className="info-box">
            <span className="label">Deadline</span>
            <span className="value">
              {new Date(position.Deadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="position-description">
          <span className="label">Job Description</span>
          <p>{position.Description}</p>
        </div>
      </div>

      {/* Action */}
      <div className="position-details-actions">
        <Button
          text="Refer Candidate"
          to={`/dashboard/employee/submit-referrals?positionId=${position.PositionId}`}
          className="refer-btn"
        />
      </div>
    </div>
  );
};

export default EmployeePositionDetails;
