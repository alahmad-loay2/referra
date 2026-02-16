import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import {
  Mail,
  Calendar,
  Briefcase,
  Check,
  ArrowLeft,
  User,
  Award,
  Gift,
  Download,
  Clock,
  MapPin,
  Circle,
  Building2,
  Users,
  Phone,
  X,
  FileText,
} from "lucide-react";
import { getReferralDetails } from "../../../api/hrReferralsDetails.api";
import {
  advanceReferralStage,
  finalizeReferral,
  unprospectReferral,
} from "../../../api/hrReferralActions.api";
import Loading from "../../../components/loading/Loading";
import "./HrReferralDetails.css";

// Hr Referral Details page that shows detailed information about a specific referral, including the candidate's information, the position they were referred for, the referral status and progress, and the employee who made the referral.

const STATUS_ORDER = [
  "Pending",
  "Confirmed",
  "InterviewOne",
  "InterviewTwo",
  "Acceptance",
  "Hired",
];

const formatEmploymentType = (type) => {
  if (!type) return "";
  const map = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    CONTRACT: "Contract",
    INTERNSHIP: "Internship",
    TEMPORARY: "Temporary",
  };
  return map[type] || type;
};

// Extract and clean CV filename from URL
const getCVFileName = (url) => {
  if (!url) return "";
  try {
    // Extract filename from URL
    const urlPath = url.split("/").pop();
    const fileName = urlPath.split("?")[0]; // Remove query params

    // Remove extension
    let nameWithoutExt = fileName.replace(/\.(pdf|PDF)$/, "");

    // Remove date patterns (common formats: YYYY-MM-DD, YYYYMMDD, etc.)
    nameWithoutExt = nameWithoutExt.replace(/\d{4}-\d{2}-\d{2}/g, ""); // YYYY-MM-DD
    nameWithoutExt = nameWithoutExt.replace(/\d{8}/g, ""); // YYYYMMDD
    nameWithoutExt = nameWithoutExt.replace(/\d{2}-\d{2}-\d{4}/g, ""); // DD-MM-YYYY
    nameWithoutExt = nameWithoutExt.replace(/\d{2}\/\d{2}\/\d{4}/g, ""); // DD/MM/YYYY

    // Clean up extra dashes/underscores
    nameWithoutExt = nameWithoutExt.replace(/[-_]+/g, " ").trim();

    // Truncate if too long and add ellipsis
    const maxLength = 30;
    if (nameWithoutExt.length > maxLength) {
      return nameWithoutExt.substring(0, maxLength) + "...";
    }

    return nameWithoutExt || "CV";
  } catch (error) {
    return "CV";
  }
};

const getHrActions = (referral) => {
  // If already prospect, only show Unprospect action
  if (referral.Prospect) {
    return [{ label: "Unprospect", action: "unprospect", disabled: false }];
  }

  const locked =
    referral.Status === "Hired" || referral.AcceptedInOtherPosition;

  switch (referral.Status) {
    case "Confirmed":
      return [
        { label: "Interview 1", action: "advance", disabled: locked },
        { label: "Prospect", action: "prospect", disabled: locked },
      ];

    case "InterviewOne":
      return [
        { label: "Interview 2", action: "advance", disabled: locked },
        { label: "Prospect", action: "prospect", disabled: locked },
      ];

    case "InterviewTwo":
      return [
        { label: "Acceptance", action: "advance", disabled: locked },
        { label: "Prospect", action: "prospect", disabled: locked },
      ];

    case "Acceptance":
      return [
        { label: "Accept", action: "accept", disabled: locked },
        { label: "Prospect", action: "prospect", disabled: locked },
      ];

    case "Hired":
      return [
        { label: "Accept", action: "accept", disabled: true },
        { label: "Prospect", action: "prospect", disabled: true },
      ];

    default:
      return [];
  }
};

const HrReferralDetails = () => {
  const { referralId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [compAmount, setCompAmount] = useState("");
  const [compError, setCompError] = useState("");

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await getReferralDetails(referralId);
      const referral = data.referral;
      const app = referral.Application;

      setReferralData({
        Referral: referral,
        Candidate: app.Candidate,
        Position: app.Position,
        ReferredBy: app.Employee,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [referralId]);

  // Auto-clear error message after 4 seconds
  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => {
        setActionError(null);
      }, 4000); // 4 seconds

      return () => clearTimeout(timer);
    }
  }, [actionError]);

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      setActionError(null); // Clear any previous errors

      if (action === "advance") {
        await advanceReferralStage(referralId);
      }

      if (action === "prospect") {
        await finalizeReferral(referralId, "Prospect");
        await loadDetails(); // refresh state
        return;
      }

      if (action === "unprospect") {
        await unprospectReferral(referralId);
        await loadDetails(); // refresh state
        return;
      }

      if (action === "accept") {
        setShowCompModal(true);
        return;
      }

      await loadDetails();
    } catch (err) {
      // Extract message from JSON if it's in that format
      let errorMessage = err.message;
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.message) {
          errorMessage = parsed.message;
        }
      } catch {
        // If parsing fails, use the original message
      }
      setActionError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !referralData) {
    return (
      <div className="hr-referral-hd-container">
        {error ? (
          <div className="hr-referral-hd-loading">{error}</div>
        ) : (
          <Loading />
        )}
      </div>
    );
  }

  const { Referral, Candidate, Position, ReferredBy } = referralData;
  const referredUser = ReferredBy?.User;
  const totalCompensation = ReferredBy?.TotalCompensation ?? "—";
  const currentIndex = STATUS_ORDER.indexOf(Referral.Status);
  const isProspectFlow = Referral.Prospect === true;

  return (
    <>
      <div className="hr-referral-hd-container">
        {/* HEADER */}
        <div className="hr-referral-hd-header">
          <div className="hr-referral-hd-header-left">
            <div className="hr-referral-hd-header-title">
              <Link to="/dashboard/hr/referrals">
                <ArrowLeft size={18} />
              </Link>
              <h3>Referral Details</h3>
            </div>
            <p>Full application details</p>
          </div>

          {/* HR ACTION BUTTONS */}
          <div className="hr-referral-hd-header-right">
            <div className="hr-referral-hd-actions-wrapper">
              <div className="hr-referral-hd-actions-buttons">
                {getHrActions(Referral).map((btn) => (
                  <button
                    key={btn.label}
                    disabled={actionLoading || btn.disabled}
                    className={
                      btn.action === "prospect" || btn.action === "unprospect"
                        ? "hr-referral-hd-secondary-btn"
                        : "hr-referral-hd-primary-btn"
                    }
                    onClick={() => handleAction(btn.action)}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              {actionError && (
                <div className="hr-referral-hd-action-error">{actionError}</div>
              )}
            </div>
          </div>
        </div>

        <div className="hr-referral-hd-content">
          {/* LEFT */}
          <div className="hr-referral-hd-content-left">
            {/* PROGRESS */}
            <div className="hr-referral-application-progress">
              <h3>
                <Clock size={18} />
                Application Progress
              </h3>

              <div className="timeline-wrapper">
                <div className="timeline">
                  {STATUS_ORDER.map((step, index) => {
                    let state = "";

                    if (index < currentIndex) {
                      state = "done";
                    }

                    if (index === currentIndex) {
                      state = "active";
                    }

                    // Prospect flow: show failure at CURRENT stage
                    if (Referral.Prospect && index === currentIndex) {
                      state = "prospect";
                    }

                    return (
                      <React.Fragment key={step}>
                        <div className={`step ${state}`}>
                          <span className="icon">
                            {state === "done" && <Check size={14} />}
                            {state === "active" && <Briefcase size={14} />}
                            {state === "prospect" && <X size={14} />}
                          </span>
                          <span className="label">{step}</span>
                        </div>

                        {index < STATUS_ORDER.length - 1 && (
                          <div
                            className={`line ${state === "done" ? "done" : ""}`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CANDIDATE INFO */}
            <div className="hr-referral-candidate-information">
              <div className="hr-referral-candidate-information-header">
                <User size={18} />
                <h3>Candidate Information</h3>
              </div>

              <div className="hr-referral-candidate-avatar-name">
                <div className="hr-referral-candidate-avatar">
                  {Candidate.FirstName[0]}
                  {Candidate.LastName[0]}
                </div>

                <div className="hr-referral-candidate-name">
                  <p>
                    {Candidate.FirstName} {Candidate.LastName}
                  </p>
                  <span>{Position.PositionTitle}</span>
                </div>
              </div>

              <hr />

              <div className="hr-referral-candidate-info">
                <div className="hr-referral-candidate-info-item">
                  <Mail size={18} />
                  <span>
                    <strong>Email:</strong> {Candidate.Email}
                  </span>
                </div>
                <div className="hr-referral-candidate-info-item">
                  <Phone size={18} />
                  <span>
                    <strong>Phone:</strong> {Candidate.PhoneNumber || "N/A"}
                  </span>
                </div>

                <div className="hr-referral-candidate-info-item">
                  <Award size={18} />
                  <span>
                    <strong>Years of Experience:</strong>{" "}
                    {Candidate.YearOfExperience}
                  </span>
                </div>
                <div className="hr-referral-candidate-info-item">
                  <Calendar size={18} />
                  <span>
                    <strong>Date:</strong>{" "}
                    {new Date(Candidate.CreatedAt).toLocaleDateString("en-CA")}
                  </span>
                </div>
              </div>

              <hr />

              <div className="hr-referral-cv-display">
                <div className="hr-referral-cv-content">
                  <FileText size={32} className="hr-referral-cv-icon" />
                  <span className="hr-referral-cv-name">
                    {getCVFileName(Candidate.CVUrl) ||
                      `${Candidate.FirstName} - CV`}
                  </span>
                  <span className="hr-referral-cv-subtext">
                    Click to download
                  </span>
                </div>

                <a
                  href={Candidate.CVUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hr-referral-cv-download-btn"
                >
                  <Download size={16} />
                  Download CV
                </a>
              </div>
            </div>
            {/* REFERRED BY */}
            <div className="hr-referral-referred-by">
              <div className="hr-referral-referred-by-header">
                <Users size={18} />
                <h3>Referred By</h3>
              </div>

              <div className="hr-referral-referred-by-user">
                <div className="hr-referral-referred-by-avatar">
                  {referredUser?.FirstName?.[0]}
                  {referredUser?.LastName?.[0]}
                </div>

                <div className="hr-referral-referred-by-name">
                  <p>
                    {referredUser?.FirstName} {referredUser?.LastName}
                  </p>
                  <span>{ReferredBy?.Position}</span>
                </div>
              </div>

              <hr />

              <div className="hr-referral-referred-by-info">
                <div className="hr-referral-referred-by-info-item">
                  <Mail size={18} />
                  <span>
                    <strong>Email:</strong> {referredUser?.Email}
                  </span>
                </div>

                <div className="hr-referral-referred-by-info-item">
                  <Briefcase size={18} />
                  <span>
                    <strong>Department:</strong> {ReferredBy?.Department}
                  </span>
                </div>

                <div className="hr-referral-referred-by-info-item">
                  <Award size={18} />
                  <span>
                    <strong>Total Compensation:</strong> {totalCompensation}$
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="hr-referral-hd-content-right">
            <div className="hr-referral-hd-content-right-card">
              <div className="hr-referral-hd-content-right-header">
                <Briefcase size={18} />
                <h3>Position Details</h3>
              </div>

              <div className="hr-referral-hd-content-right-title">
                <h4>{Position.PositionTitle}</h4>
                <span className="hr-referral-hd-content-right-title-label">
                  {formatEmploymentType(Position.EmploymentType)}
                </span>
              </div>

              <hr />

              <div className="hr-referral-hd-content-right-details">
                <div className="hr-referral-hd-content-right-details-item">
                  <Building2 size={18} />
                  <span>
                    <strong>Company Name:</strong> {Position.CompanyName}
                  </span>
                </div>
                <div className="hr-referral-hd-content-right-details-item">
                  <Award size={18} />
                  <span>
                    <strong>Years Required:</strong> {Position.YearsRequired}
                  </span>
                </div>
                <div className="hr-referral-hd-content-right-details-item">
                  <Clock size={18} />
                  <span>
                    <strong>Timezone:</strong> {Position.Timezone}
                  </span>
                </div>
                <div className="hr-referral-hd-content-right-details-item">
                  <MapPin size={18} />
                  <span>
                    <strong>Location:</strong> {Position.PositionLocation}
                  </span>
                </div>
                <div className="hr-referral-hd-content-right-details-item">
                  <Circle size={18} />
                  <span>
                    <strong>Status:</strong> {Position.PositionState}
                  </span>
                </div>
                <div className="emp-referral-hd-content-right-details-item">
                  <Calendar size={18} />
                  <span>
                    <strong>Deadline:</strong>{" "}
                    {Position.Deadline
                      ? new Date(Position.Deadline).toLocaleDateString(
                          "en-CA",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        )
                      : "N/A"}
                  </span>
                </div>
              </div>
              {Position.Description && (
                <>
                  <hr />
                  <div className="hr-referral-hd-content-right-description">
                    <h4>Description</h4>
                    <div className="hr-referral-hd-content-right-description-content">
                      <p>{Position.Description}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {showCompModal && (
          <div className="hr-comp-modal-backdrop">
            <div className="hr-comp-modal">
              <button
                className="hr-comp-modal-close"
                disabled={actionLoading}
                onClick={() => {
                  if (actionLoading) return; // prevent close mid-payment
                  setShowCompModal(false);
                  setCompAmount("");
                  setCompError("");
                }}
                aria-label="Close"
              >
                <X size={22} />
              </button>

              <div className="hr-comp-modal-icon">
                <Gift size={150} strokeWidth={0.5} />
              </div>

              <h3>Congratulation a new employee has been hired !</h3>

              <p>
                <span className="othercolor">
                  How much do you want to compensate{" "}
                  <strong>
                    {referredUser?.FirstName} {referredUser?.LastName}
                  </strong>
                  ?
                </span>{" "}
              </p>

              <input
                type="number"
                min="0"
                placeholder="Set amount in $"
                value={compAmount}
                disabled={actionLoading}
                onChange={(e) => {
                  setCompAmount(e.target.value);
                  setCompError("");
                }}
                className="hr-comp-modal-input"
              />

              {compError && (
                <div className="hr-comp-modal-error">{compError}</div>
              )}

              <button
                className="hr-comp-modal-submit"
                disabled={actionLoading}
                onClick={async () => {
                  if (actionLoading) return; // HARD STOP double click

                  if (compAmount === "" || Number(compAmount) < 0) {
                    setCompError("Please enter a valid amount (0 or more)");
                    return;
                  }

                  try {
                    setActionLoading(true);

                    await finalizeReferral(
                      referralId,
                      "hire",
                      Number(compAmount),
                    );

                    setShowCompModal(false);
                    navigate("/dashboard/hr/referrals");
                  } catch (err) {
                    setCompError(err.message);
                  } finally {
                    setActionLoading(false);
                  }
                }}
              >
                {actionLoading ? "Processing payment…" : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HrReferralDetails;
