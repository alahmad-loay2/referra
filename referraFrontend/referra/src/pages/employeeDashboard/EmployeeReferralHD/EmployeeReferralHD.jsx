import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Mail, Calendar, Briefcase, Check, ArrowLeft, Edit, Trash2, User, Award, Download, FileText, Clock, MapPin, Circle, Upload, X, Building2, Users } from "lucide-react";
import { fetchEmployeeReferralDetails, editCandidate, deleteCandidate } from "../../../api/employeeReferrals.api";
import "./EmployeeReferralHD.css";

const STATUS_ORDER = [
  "Pending",
  "Confirmed",
  "InterviewOne",
  "InterviewTwo",
  "Acceptance",
  "Hired",
];

const EmployeeReferralHD = () => {
  const { referralId } = useParams();
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    experience: "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [cvError, setCvError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const fetchReferralDetails = async () => {
      try {
        const data = await fetchEmployeeReferralDetails(referralId);
        setReferralData(data);
        setEditForm({
          firstName: data.Candidate.FirstName || "",
          lastName: data.Candidate.LastName || "",
          email: data.Candidate.Email || "",
          experience: data.Candidate.YearOfExperience || "",
        });
        setError(null);
      } catch (error) {
        setError(error.message || "Failed to load referral details");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReferralDetails();
  }, [referralId]);

  const handleDelete = async () => {
    if (!referralData?.Candidate?.CandidateId || referralData?.Referral?.Status !== "Pending") return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteCandidate(referralData.Referral.ReferralId);
      navigate("/dashboard/employee/my-referrals");
    } catch (error) {
      alert(error.message || "Failed to delete referral");
      console.error(error);
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    if (referralData?.Referral?.Status !== "Pending") return;
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (isEditMode) {
      setShowCancelConfirm(true);
    }
  };

  const confirmCancel = () => {
    setIsEditMode(false);
    setEditForm({
      firstName: referralData.Candidate.FirstName || "",
      lastName: referralData.Candidate.LastName || "",
      email: referralData.Candidate.Email || "",
      experience: referralData.Candidate.YearOfExperience || "",
    });
    setCvFile(null);
    setCvError("");
    setShowCancelConfirm(false);
  };

  const handleSave = () => {
    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    setEditLoading(true);
    try {
      await editCandidate(referralData.Candidate.CandidateId, editForm, cvFile);
      const updatedData = await fetchEmployeeReferralDetails(referralId);
      setReferralData(updatedData);
      setIsEditMode(false);
      setCvFile(null);
      setCvError("");
      setShowSaveConfirm(false);
    } catch (error) {
      alert(error.message || "Failed to edit candidate");
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setCvError("Only PDF files are allowed");
      setCvFile(null);
      return;
    }

    setCvError("");
    setCvFile(file);
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setCvError("Only PDF files are allowed");
      setCvFile(null);
      return;
    }

    setCvError("");
    setCvFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="referral-hd-container">
        <div className="referral-hd-loading">Loading referral details…</div>
      </div>
    );
  }

  if (error || !referralData) {
    return (
      <div className="referral-hd-container">
        <Link to="/dashboard/employee/my-referrals" className="referral-hd-back-link">
          <ArrowLeft size={18} />
          Referral Details
        </Link>
        <div className="referral-hd-error">{error || "Referral not found"}</div>
      </div>
    );
  }

  const { Referral, Candidate, Position } = referralData;
  const status = Referral.Status;
  const createdAt = Referral.CreatedAt;
  const currentIndex = STATUS_ORDER.indexOf(status);
  const isPending = status === "Pending";

  // Format employment type for display
  const formatEmploymentType = (type) => {
    if (!type) return "";
    const typeMap = {
      FULL_TIME: "Full Time",
      PART_TIME: "Part Time",
      CONTRACT: "Contract",
      INTERNSHIP: "Internship",
      TEMPORARY: "Temporary",
    };
    return typeMap[type] || type;
  };

  // Extract and clean CV filename from URL
  const getCVFileName = (url) => {
    if (!url) return "";
    try {
      // Extract filename from URL
      const urlPath = url.split('/').pop();
      const fileName = urlPath.split('?')[0]; // Remove query params
      
      // Remove extension
      let nameWithoutExt = fileName.replace(/\.(pdf|PDF)$/, '');
      
      // Remove date patterns (common formats: YYYY-MM-DD, YYYYMMDD, etc.)
      nameWithoutExt = nameWithoutExt.replace(/\d{4}-\d{2}-\d{2}/g, ''); // YYYY-MM-DD
      nameWithoutExt = nameWithoutExt.replace(/\d{8}/g, ''); // YYYYMMDD
      nameWithoutExt = nameWithoutExt.replace(/\d{2}-\d{2}-\d{4}/g, ''); // DD-MM-YYYY
      nameWithoutExt = nameWithoutExt.replace(/\d{2}\/\d{2}\/\d{4}/g, ''); // DD/MM/YYYY
      
      // Clean up extra dashes/underscores
      nameWithoutExt = nameWithoutExt.replace(/[-_]+/g, ' ').trim();
      
      // Truncate if too long and add ellipsis
      const maxLength = 30;
      if (nameWithoutExt.length > maxLength) {
        return nameWithoutExt.substring(0, maxLength) + '...';
      }
      
      return nameWithoutExt || "CV";
    } catch (error) {
      return "CV";
    }
  };

  return (
      <>
        <div className="referral-hd-container">
          <div className="referral-hd-header">
            <div className="referral-hd-header-left">
              <div className="referral-hd-header-title">
                <Link to="/dashboard/employee/my-referrals">
                  <ArrowLeft size={18} />
                </Link>
                <h3>Referral Details</h3>
              </div>
              <p>
                View and manage your referral details.
              </p>
            </div>
            <div className="referral-hd-header-right">
              {!isEditMode ? (
                <>
                  <button 
                    className="referral-hd-edit-btn" 
                    onClick={handleEdit}
                    disabled={!isPending}
                  >
                    Edit
                  </button>
                  <button 
                    className="referral-hd-delete-btn" 
                    onClick={handleDelete}
                    disabled={!isPending || deleteLoading}
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="referral-hd-cancel-btn" 
                    onClick={handleCancel}
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="referral-hd-save-btn" 
                    onClick={handleSave}
                    disabled={editLoading}
                  >
                    {editLoading ? "Saving..." : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="emp-referral-hd-content">
            <div className="emp-referral-hd-content-left">
              <div className="emp-referral-application-progress">
                <h3>
                  <Clock size={18} />
                  Application Progress
                </h3>
                <div className="timeline-wrapper">
                  <div className="timeline">
                    {STATUS_ORDER.map((step, index) => {
                      const isDone = index < currentIndex;
                      const isActive = index === currentIndex;
                      const isProspect = Referral.Prospect && isActive;

                      return (
                        <React.Fragment key={step}>
                          <div
                            className={`step ${
                              isDone ? "done" : ""
                            } ${isActive ? "active" : ""} ${isProspect ? "prospect" : ""}`}
                          >
                            <span className="icon">
                              {isDone && <Check size={14} />}
                              {isActive && !isProspect && (
                                <Briefcase size={14} />
                              )}
                              {isProspect && <X size={14} />}
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
                  {Referral.Prospect && (
                    <span className="status-badge-secondary status-badge-prospect">
                      Prospect
                    </span>
                  )}
                </div>
              </div>
              <div className="emp-referral-candidate-information">
                <div className="emp-referral-candidate-information-header">
                  <User size={18} />
                  <h3>Candidate Information</h3>
                </div>
                
                <div className="emp-referral-candidate-avatar-name">
                  <div className="emp-referral-candidate-avatar">
                    {isEditMode
                      ? (editForm.firstName[0] || "") + (editForm.lastName[0] || "")
                      : Candidate.FirstName[0] + Candidate.LastName[0]}
                  </div>
                  
                  {isEditMode ? (
                    <div className="emp-referral-candidate-name-edit">
                      <p>
                        {editForm.firstName || ""} {editForm.lastName || ""}
                      </p>
                    </div>
                  ) : (
                    <div className="emp-referral-candidate-name">
                      <p>
                        {Candidate.FirstName} {Candidate.LastName}
                      </p>
                      <span>{Position.PositionTitle}</span>
                    </div>
                  )}
                </div>
                
                <hr />
                
                <div className="emp-referral-candidate-info">
                  {isEditMode ? (
                    <>
                      <div className="emp-referral-edit-field">
                        <label className="emp-referral-edit-label">
                          <User size={18} />
                          <span>
                            First Name <span>*</span>
                          </span>
                        </label>
                        <input
                          name="firstName"
                          value={editForm.firstName}
                          onChange={handleFormChange}
                          className="emp-referral-edit-input"
                          placeholder="First Name"
                        />
                      </div>
                      <div className="emp-referral-edit-field">
                        <label className="emp-referral-edit-label">
                          <User size={18} />
                          <span>
                            Last Name <span>*</span>
                          </span>
                        </label>
                        <input
                          name="lastName"
                          value={editForm.lastName}
                          onChange={handleFormChange}
                          className="emp-referral-edit-input"
                          placeholder="Last Name"
                        />
                      </div>
                      <div className="emp-referral-edit-field">
                        <label className="emp-referral-edit-label">
                          <Mail size={18} />
                          <span>
                            Email <span>*</span>
                          </span>
                        </label>
                        <input
                          name="email"
                          type="email"
                          value={editForm.email}
                          onChange={handleFormChange}
                          className="emp-referral-edit-input"
                          placeholder="Email"
                        />
                      </div>
                      <div className="emp-referral-edit-field">
                        <label className="emp-referral-edit-label">
                          <Award size={18} />
                          <span>
                            Years of Experience <span>*</span>
                          </span>
                        </label>
                        <input
                          name="experience"
                          type="number"
                          value={editForm.experience}
                          onChange={handleFormChange}
                          className="emp-referral-edit-input"
                          placeholder="Years of Experience"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="emp-referral-candidate-info-item">
                        <Mail size={18} />
                        <span>
                          <strong>Email:</strong> {Candidate.Email}
                        </span>
                      </div>
                      <div className="emp-referral-candidate-info-item">
                        <Award size={18} />
                        <span>
                          <strong>Years of Experience:</strong> {Candidate.YearOfExperience}
                        </span>
                      </div>
                      <div className="emp-referral-candidate-info-item">
                        <Calendar size={18} />
                        <span>
                          <strong>Date:</strong>{" "}
                          {new Date(Candidate.CreatedAt).toLocaleDateString("en-CA", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                <hr />
                
                <div className="emp-referral-cv-section">
                  {!isEditMode && Candidate.CVUrl ? (
                    <div className="emp-referral-cv-display">
                      <span className="emp-referral-cv-name">
                        {Candidate.FirstName} - CV
                      </span>
                      <a
                        href={Candidate.CVUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="emp-referral-cv-download-btn"
                        download
                      >
                        <Download size={16} />
                        Download CV
                      </a>
                    </div>
                  ) : isEditMode ? (
                    <div
                      className="emp-referral-cv-upload"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => document.getElementById("cvUploadEdit").click()}
                    >
                      <Upload size={28} className="emp-referral-upload-icon" />
                      {cvFile ? (
                        <div className="emp-referral-file-preview">
                          <span className="emp-referral-file-icon">📄</span>
                          <span className="emp-referral-file-name">{cvFile.name}</span>
                          <button
                            type="button"
                            className="emp-referral-remove-file"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCvFile(null);
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : Candidate.CVUrl ? (
                        <p>Click to upload new CV or drag and drop (PDF only). Current CV will be replaced.</p>
                      ) : (
                        <p>Click to upload or drag and drop (PDF only)</p>
                      )}
                      {cvError && <p className="emp-referral-error-text">{cvError}</p>}
                      <input
                        id="cvUploadEdit"
                        type="file"
                        accept=".pdf"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="emp-referral-hd-content-right">
              <div className="emp-referral-hd-content-right-card">
                <div className="emp-referral-hd-content-right-header">
                  <Briefcase size={18} />
                  <h3>Position Details</h3>
                </div>
                
                <div className="emp-referral-hd-content-right-title">
                  <h4>{Position.PositionTitle}</h4>
                  {Position.EmploymentType && (
                    <span className="emp-referral-hd-content-right-title-label">
                      {formatEmploymentType(Position.EmploymentType)}
                    </span>
                  )}
                </div>
                
                <hr />
                
                <div className="emp-referral-hd-content-right-details">
                  <div className="emp-referral-hd-content-right-details-item">
                    <Building2 size={18} />
                    <span>
                      <strong>Company Name:</strong> {Position.CompanyName}
                    </span>
                  </div>
                  <div className="emp-referral-hd-content-right-details-item">
                    <Award size={18} />
                    <span>
                      <strong>Years Required:</strong> {Position.YearsRequired}
                    </span>
                  </div>
                  <div className="emp-referral-hd-content-right-details-item">
                    <Clock size={18} />
                    <span>
                      <strong>Timezone:</strong> {Position.Timezone}
                    </span>
                  </div>
                  <div className="emp-referral-hd-content-right-details-item">
                    <MapPin size={18} />
                    <span>
                      <strong>Location:</strong> {Position.PositionLocation}
                    </span>
                  </div>
                  <div className="emp-referral-hd-content-right-details-item">
                    <Circle size={18} />
                    <span>
                      <strong>Status:</strong> {Position.PositionState}
                    </span>
                  </div>
                  <div className="emp-referral-hd-content-right-details-item">
                    <Calendar size={18} />
                    <span>
                      <strong>Deadline:</strong> {Position.Deadline ? new Date(Position.Deadline).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      }) : "N/A"}
                    </span>
                  </div>
                </div>
                
                {Position.Description && (
                  <>
                    <hr />
                    <div className="emp-referral-hd-content-right-description">
                      <h4>Description</h4>
                      <div className="emp-referral-hd-content-right-description-content">
                        <p>{Position.Description}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="referral-hd-modal-overlay">
            <div className="referral-hd-modal">
              <h3>Delete candidate?</h3>
              <p>
                Are you sure you want to delete this candidate? This action cannot be undone.
              </p>
              <div className="referral-hd-modal-actions">
                <button
                  className="referral-hd-modal-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button 
                  className="referral-hd-modal-confirm" 
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Yes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Confirmation Modal */}
        {showSaveConfirm && (
          <div className="referral-hd-modal-overlay">
            <div className="referral-hd-modal">
              <h3>Save changes?</h3>
              <p>
                Are you sure you want to save these changes? The candidate information will be updated.
              </p>
              <div className="referral-hd-modal-actions">
                <button
                  className="referral-hd-modal-cancel"
                  onClick={() => setShowSaveConfirm(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button 
                  className="referral-hd-modal-confirm" 
                  onClick={confirmSave}
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Yes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="referral-hd-modal-overlay">
            <div className="referral-hd-modal">
              <h3>Cancel editing?</h3>
              <p>
                Are you sure you want to cancel? All unsaved changes will be lost.
              </p>
              <div className="referral-hd-modal-actions">
                <button
                  className="referral-hd-modal-cancel"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  No
                </button>
                <button 
                  className="referral-hd-modal-confirm" 
                  onClick={confirmCancel}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </>
  );
};

export default EmployeeReferralHD;
