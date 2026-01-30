import React, { useEffect, useState } from "react";
import { getVisiblePositions } from "../../../api/positions.api";
import { submitReferral } from "../../../api/employeeReferrals.api";
import { Briefcase, Upload } from "lucide-react";

import "./EmployeeSubmit.css";

const EmployeeSubmit = () => {
  // to fetch positions from backend to the dropdown
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [positionsError, setPositionsError] = useState("");

  // to handle CV upload
  const [cvFile, setCvFile] = useState(null);
  const [cvError, setCvError] = useState("");

  // for reset button
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    experience: "",
    positionId: "",
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // for submit button
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (submitSuccess || submitError) {
      const timer = setTimeout(() => {
        setSubmitSuccess("");
        setSubmitError("");
      }, 10000); // 10seconds

      return () => clearTimeout(timer);
    }
  }, [submitSuccess, submitError]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.positionId) newErrors.positionId = "Position is required";
    if (!form.firstName) newErrors.firstName = "First name is required";
    if (!form.lastName) newErrors.lastName = "Last name is required";
    if (!form.email) newErrors.email = "Email is required";
    if (!form.experience) newErrors.experience = "Experience is required";
    if (!cvFile) newErrors.cvFile = "CV is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // for position fetching
  useEffect(() => {
    const loadPositions = async () => {
      setLoadingPositions(true);

      const result = await getVisiblePositions();

      if (result.error) {
        setPositionsError(result.error);
      } else {
        setPositions(result.positions);
      }

      setLoadingPositions(false);
    };

    loadPositions();
  }, []);

  // CV upload handlers
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // reset button handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const confirmReset = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      experience: "",
      positionId: "",
    });

    setCvFile(null);
    setCvError("");
    setPositionsError("");

    setShowResetConfirm(false);
  };
  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitSuccess("");

    const isValid = validateForm();
    if (!isValid) return;

    try {
      setSubmitLoading(true);

      await submitReferral(form, cvFile);

      setSubmitSuccess("Referral submitted successfully");
      setErrors({});
      confirmReset();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="employeeSubmit">
      <h2>Submit a Referral</h2>
      <p>Refer a qualified candidate for an open position</p>

      {/* Select Position */}
      <div className="employeeSubmit-card">
        <h4 className="employeeSubmit-title">
          <Briefcase size={18} className="employeeSubmit-titleIcon" />
          Select Position
        </h4>

        <p>Choose the position you're referring the candidate for</p>
        {positionsError && <p>{positionsError}</p>}

        <select
          name="positionId"
          value={form.positionId}
          onChange={handleChange}
          className="employeeSubmit-select"
          disabled={loadingPositions}
        >
          <option value="">Select a position</option>

          {positions.map((pos) => (
            <option key={pos.PositionId} value={pos.PositionId}>
              {pos.PositionTitle}
            </option>
          ))}
        </select>
        {errors.positionId && <p className="errorText">{errors.positionId}</p>}
      </div>

      {/* Candidate Details */}
      <div className="employeeSubmit-card">
        <h4>Candidate Details</h4>
        <p>Enter the candidate's personal information</p>

        <div className="employeeSubmit-formGrid">
          <div className="employeeSubmit-field">
            <label className="employeeSubmit-label">
              First Name <span>*</span>
            </label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="employeeSubmit-input"
              placeholder="Jana"
            />
            {errors.firstName && (
              <p className="errorText">{errors.firstName}</p>
            )}
          </div>

          <div className="employeeSubmit-field">
            <label className="employeeSubmit-label">
              Last Name <span>*</span>
            </label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="employeeSubmit-input"
              placeholder="Al-Mawla"
            />
            {errors.lastName && <p className="errorText">{errors.lastName}</p>}
          </div>

          <div className="employeeSubmit-field">
            <label className="employeeSubmit-label">
              Email <span>*</span>
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="employeeSubmit-input"
              placeholder="you@example.com"
            />
            {errors.email && <p className="errorText">{errors.email}</p>}
          </div>

          <div className="employeeSubmit-field">
            <label className="employeeSubmit-label">
              Total Years of Experience <span>*</span>
            </label>
            <input
              name="experience"
              value={form.experience}
              onChange={handleChange}
              className="employeeSubmit-input"
              placeholder="5"
            />
            {errors.experience && (
              <p className="errorText">{errors.experience}</p>
            )}
          </div>
        </div>

        <div
          className="employeeSubmit-upload"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById("cvUpload").click()}
        >
          <Upload size={28} className="employeeSubmit-uploadIcon" />

          {cvFile ? (
            <div className="employeeSubmit-filePreview">
              <span className="employeeSubmit-fileIcon">📄</span>
              <span className="employeeSubmit-fileName">{cvFile.name}</span>
              <button
                type="button"
                className="employeeSubmit-removeFile"
                onClick={(e) => {
                  e.stopPropagation();
                  setCvFile(null);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <p>Click to upload or drag and drop (PDF only)</p>
          )}

          {cvError && <p className="errorText">{cvError}</p>}

          <input
            id="cvUpload"
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {errors.cvFile && <p className="errorText">{errors.cvFile}</p>}
        </div>
      </div>

      {/* Actions */}
      {/* Actions */}
      <div className="employeeSubmit-actions">
        <button
          type="button"
          className="employeeSubmit-reset"
          onClick={() => setShowResetConfirm(true)}
        >
          Reset all
        </button>

        <button
          type="button"
          className="employeeSubmit-submit"
          onClick={handleSubmit}
          disabled={submitLoading}
        >
          {submitLoading ? "Submitting..." : "Submit Referral"}
        </button>
      </div>
      {showResetConfirm && (
        <div className="employeeSubmit-modalOverlay">
          <div className="employeeSubmit-modal">
            <h3>Reset form?</h3>
            <p>
              Are you sure you want to reset this referral? All entered data
              will be lost.
            </p>

            <div className="employeeSubmit-modalActions">
              <button
                className="employeeSubmit-cancel"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>

              <button className="employeeSubmit-confirm" onClick={confirmReset}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      {(submitSuccess || submitError) && (
        <div
          className={`employeeSubmit-feedback ${
            submitSuccess ? "success" : "error"
          }`}
        >
          {submitSuccess || submitError}
        </div>
      )}
    </div>
  );
};

export default EmployeeSubmit;
