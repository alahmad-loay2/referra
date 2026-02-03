import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getReferralDetails } from "../../../api/hrReferralsDetails.api";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Briefcase,
  Check,
  User,
  Award,
  FileText,
  Download,
  Clock,
  MapPin,
  Circle,
  Users,
} from "lucide-react";
import "./HrReferralDetails.css";

const STATUS_ORDER = [
  "Pending",
  "Confirmed",
  "InterviewOne",
  "InterviewTwo",
  "Acceptance",
  "Hired",
];

const HrReferralDetails = () => {
  const { referralId } = useParams();
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);

  useEffect(() => {
    const loadReferralDetails = async () => {
      try {
        setLoading(true);

        const data = await getReferralDetails(referralId);
        const referral = data.referral;
        const application = referral.Application;

        setReferralData({
          Referral: referral,
          Candidate: application.Candidate,
          Position: application.Position,
          ReferredBy: application.Employee,
        });
        //console.log(data);
      } catch (error) {
        console.error("Error loading referral details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReferralDetails();
  }, [referralId]);

  if (loading || !referralData) {
    return (
      <div className="referral-hd-container">
        <p>Loading referral details…</p>
      </div>
    );
  }

  const { Referral, Candidate, Position, ReferredBy } = referralData;
  const ReferredUser = ReferredBy?.User;

  const totalCompensation = ReferredBy?.TotalCompensation ?? "—";

  const currentIndex = STATUS_ORDER.indexOf(Referral.Status);

  return (
    <div className="referral-hd-container">
      {/* HEADER */}
      <div className="referral-hd-header">
        <div className="referral-hd-header-left">
          <div className="referral-hd-header-title">
            <Link to="/dashboard/hr/referrals">
              <ArrowLeft size={18} />
            </Link>
            <h3>Referral Details</h3>
          </div>
          <p>
            Full application details for: {Candidate?.FirstName}{" "}
            {Candidate?.LastName}
          </p>
        </div>

        <div className="referral-hd-header-right">
          <button className="referral-hd-hired-btn">Mark as Hired</button>
          <button className="referral-hd-prospect-btn">Prospect</button>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="referral-hd-progress-bar">
        <h3>Application Progress</h3>
        <div className="timeline">
          {STATUS_ORDER.map((step, index) => {
            const isDone = index < currentIndex;
            const isActive = index === currentIndex;

            return (
              <React.Fragment key={step}>
                <div
                  className={`step ${isDone ? "done" : ""} ${
                    isActive ? "active" : ""
                  }`}
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

      {/* CONTENT */}
      <div className="referral-hd-content">
        {/* LEFT */}
        <div className="referral-hd-content-left">
          <div className="referral-hd-content-left-header">
            <User size={18} />
            <h3>Candidate Information</h3>
          </div>

          <div className="referral-hd-content-left-candidate">
            <div className="referral-hd-content-left-candidate-avatar">
              {Candidate?.FirstName?.[0]}
              {Candidate?.LastName?.[0]}
            </div>
            <p>
              {Candidate?.FirstName} {Candidate?.LastName}
            </p>
            <span>{Position?.PositionTitle}</span>
          </div>

          <hr />

          <div className="referral-hd-content-left-candidate-info">
            <div className="referral-hd-content-left-candidate-info-item">
              <Mail size={18} />
              <span>
                <strong>Email:</strong> {Candidate?.Email}
              </span>
            </div>

            <div className="referral-hd-content-left-candidate-info-item">
              <Award size={18} />
              <span>
                <strong>Years of Experience:</strong>{" "}
                {Candidate?.YearsOfExperience}
              </span>
            </div>

            <div className="referral-hd-content-left-candidate-info-item">
              <Calendar size={18} />
              <span>
                <strong>Date:</strong>{" "}
                {new Date(Candidate?.CreatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <hr />

          <div className="referral-hd-content-left-cv">
            <div className="referral-hd-content-left-cv-header">
              <div className="referral-hd-content-left-cv-header-left">
                <FileText size={18} />
                <h4>CV</h4>
              </div>
              <a
                href={Candidate?.CVUrl}
                className="referral-hd-cv-download-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={16} />
                Download CV
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="referral-hd-content-right">
          <div className="referral-hd-content-right-header">
            <Briefcase size={18} />
            <h3>Position Details</h3>
          </div>

          <div className="referral-hd-content-right-title">
            <span className="referral-hd-content-right-title-label">
              Position Title
            </span>
            <h4>{Position?.PositionTitle}</h4>
          </div>

          <hr />

          <div className="referral-hd-content-right-details">
            <div className="referral-hd-content-right-details-item">
              <Award size={18} />
              <span>
                <strong>Years Required:</strong> {Position?.YearsRequired}
              </span>
            </div>

            <div className="referral-hd-content-right-details-item">
              <Clock size={18} />
              <span>
                <strong>Timezone:</strong> {Position?.Timezone}
              </span>
            </div>

            <div className="referral-hd-content-right-details-item">
              <MapPin size={18} />
              <span>
                <strong>Location:</strong> {Position?.PositionLocation}
              </span>
            </div>

            <div className="referral-hd-content-right-details-item">
              <Circle size={18} />
              <span>
                <strong>Status:</strong> {Position?.PositionState}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* REFERRED BY */}
      <div className="referred-by-container">
        <div className="referred-by-header">
          <Users size={18} />
          <h3>Referred By</h3>
        </div>

        <div className="referred-by-row">
          <div className="referred-by-user">
            <div className="referred-by-avatar">
              {ReferredUser?.FirstName?.[0]}
              {ReferredUser?.LastName?.[0]}
            </div>
            <div>
              <p className="referred-by-name">
                {ReferredUser?.FirstName} {ReferredUser?.LastName}
              </p>
              <span className="referred-by-role">{ReferredBy?.Position}</span>
            </div>
          </div>

          <div className="referred-by-info">
            <div className="referred-by-labels">
              <span>Email</span>
              <span>Department</span>
              <span>Total Compensation</span>
            </div>

            <div className="referred-by-values">
              <div className="value">
                <Mail size={16} />
                <span>{ReferredUser?.Email}</span>
              </div>

              <div className="value">
                <Briefcase size={16} />
                <span>{ReferredBy?.Department}</span>
              </div>

              <div className="value">
                <Award size={16} />
                <span>{totalCompensation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrReferralDetails;
