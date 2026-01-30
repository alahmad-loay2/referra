import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Mail, Calendar, Briefcase, Check, ArrowLeft, Edit, Trash2, User, Award, Download, FileText, Clock, MapPin, Circle, Upload, X } from "lucide-react";
import { fetchEmployeeReferralDetails, editCandidate, deleteCandidate } from "../../../api/employeeReferrals.api";
import "./EmployeeReferralHD.css";

const STATUS_ORDER = [
  "Pending",
  "Confirmed",
  "InterviewOne",
  "InterviewTwo",
  "Acceptance",
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

  return (
      <div className="referral-hd-container">
        <div className="referral-hd-header">
          <div className="referral-hd-header-left">
          <div className="referral-hd-header-title">
          <Link to="/dashboard/employee/my-referrals">
            <ArrowLeft size={18} />
          </Link>
          <h3>Referral Details</h3>
          </div>
          <p>Full Application Details for: {referralData.Candidate.FirstName} {referralData.Candidate.LastName}</p>
          </div>
          <div className="referral-hd-header-right">
            {!isEditMode ? (
              <>
                <button 
                  onClick={handleEdit} 
                  className="referral-hd-edit-btn" 
                  disabled={!isPending}
                >
                  Edit
                </button>
                <button 
                  onClick={handleDelete} 
                  className="referral-hd-delete-btn" 
                  disabled={!isPending || deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleCancel} 
                  className="referral-hd-cancel-btn" 
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  className="referral-hd-save-btn" 
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="referral-hd-progress-bar">
          <h3>Application Progress</h3>
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

        <div className="referral-hd-content">
          <div className="referral-hd-content-left">
            <div className="referral-hd-content-left-header">
            <User size={18} />
            <h3>Candidate Information</h3>
            </div>
            <div className="referral-hd-content-left-candidate">
              <div className="referral-hd-content-left-candidate-avatar">
                {isEditMode 
                  ? (editForm.firstName[0] || "") + (editForm.lastName[0] || "")
                  : referralData.Candidate.FirstName[0] + referralData.Candidate.LastName[0]
                }
              </div>
              {isEditMode ? (
                <div className="referral-hd-candidate-name-edit">
                  <p>{editForm.firstName || ""} {editForm.lastName || ""}</p>
                </div>
              ) : (
                <p>{referralData.Candidate.FirstName} {referralData.Candidate.LastName}</p>
              )}
              <span>{referralData.Position.PositionTitle}</span>
            </div>
            <hr />
            <div className="referral-hd-content-left-candidate-info">
              {isEditMode ? (
                <>
                  <div className="referral-hd-edit-field">
                    <label className="referral-hd-edit-label">
                      <User size={18} />
                      <span>First Name <span>*</span></span>
                    </label>
                    <input
                      name="firstName"
                      value={editForm.firstName}
                      onChange={handleFormChange}
                      className="referral-hd-edit-input"
                      placeholder="First Name"
                    />
                  </div>
                  <div className="referral-hd-edit-field">
                    <label className="referral-hd-edit-label">
                      <User size={18} />
                      <span>Last Name <span>*</span></span>
                    </label>
                    <input
                      name="lastName"
                      value={editForm.lastName}
                      onChange={handleFormChange}
                      className="referral-hd-edit-input"
                      placeholder="Last Name"
                    />
                  </div>
                  <div className="referral-hd-edit-field">
                    <label className="referral-hd-edit-label">
                      <Mail size={18} />
                      <span>Email <span>*</span></span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={editForm.email}
                      onChange={handleFormChange}
                      className="referral-hd-edit-input"
                      placeholder="Email"
                    />
                  </div>
                  <div className="referral-hd-edit-field">
                    <label className="referral-hd-edit-label">
                      <Award size={18} />
                      <span>Years of Experience <span>*</span></span>
                    </label>
                    <input
                      name="experience"
                      type="number"
                      value={editForm.experience}
                      onChange={handleFormChange}
                      className="referral-hd-edit-input"
                      placeholder="Years of Experience"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="referral-hd-content-left-candidate-info-item">
                    <Mail size={18} />
                    <span><strong>Email:</strong> {referralData.Candidate.Email}</span>
                  </div>
                  <div className="referral-hd-content-left-candidate-info-item">
                    <Award size={18} />
                    <span><strong>Years of Experience:</strong> {referralData.Candidate.YearOfExperience}</span>
                  </div>
                  <div className="referral-hd-content-left-candidate-info-item">
                    <Calendar size={18} />
                    <span><strong>Date:</strong> {new Date(referralData.Candidate.CreatedAt).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                  </div>
                </>
              )}
            </div>
            <hr />
            <div className="referral-hd-content-left-cv">
              <div className="referral-hd-content-left-cv-header">
                <div className="referral-hd-content-left-cv-header-left">
                  <FileText size={18} />
                  <h4>CV</h4>
                </div>
                {!isEditMode && referralData.Candidate.CVUrl && (
                  <a 
                    href={referralData.Candidate.CVUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="referral-hd-cv-download-btn"
                    download
                  >
                    <Download size={16} />
                    Download CV
                  </a>
                )}
              </div>
              {isEditMode && (
                <div
                  className="referral-hd-cv-upload"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById("cvUploadEdit").click()}
                >
                  <Upload size={28} className="referral-hd-upload-icon" />
                  {cvFile ? (
                    <div className="referral-hd-file-preview">
                      <span className="referral-hd-file-icon">📄</span>
                      <span className="referral-hd-file-name">{cvFile.name}</span>
                      <button
                        type="button"
                        className="referral-hd-remove-file"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCvFile(null);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : referralData.Candidate.CVUrl ? (
                    <p>Click to upload new CV or drag and drop (PDF only). Current CV will be replaced.</p>
                  ) : (
                    <p>Click to upload or drag and drop (PDF only)</p>
                  )}
                  {cvError && <p className="referral-hd-error-text">{cvError}</p>}
                  <input
                    id="cvUploadEdit"
                    type="file"
                    accept=".pdf"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
            
          </div>
          <div className="referral-hd-content-right">
            <div className="referral-hd-content-right-header">
              <Briefcase size={18} />
              <h3>Position Details</h3>
            </div>
            <div className="referral-hd-content-right-title">
              <span className="referral-hd-content-right-title-label">Position Title</span>
              <h4>{referralData.Position.PositionTitle}</h4>
            </div>
            <hr />
            <div className="referral-hd-content-right-details">
              <div className="referral-hd-content-right-details-item">
                <Award size={18} />
                <span><strong>Years Required:</strong> {referralData.Position.YearsRequired}</span>
              </div>
              <div className="referral-hd-content-right-details-item">
                <Clock size={18} />
                <span><strong>Timezone:</strong> {referralData.Position.Timezone}</span>
              </div>
              <div className="referral-hd-content-right-details-item">
                <MapPin size={18} />
                <span><strong>Location:</strong> {referralData.Position.PositionLocation}</span>
              </div>
              <div className="referral-hd-content-right-details-item">
                <Circle size={18} />
                <span><strong>State:</strong> {referralData.Position.PositionState}</span>
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

      </div>
  );
};

export default EmployeeReferralHD;
