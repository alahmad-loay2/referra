import React, { useEffect, useState } from "react";
import {
  fetchVisiblePositions,
  getPositionDetails,
} from "../../../api/positions.api";
import {
  submitReferral,
  checkCandidateByEmail,
} from "../../../api/employeeReferrals.api";
import { Briefcase, Upload } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import SearchableSelect from "../../../components/searchableSelect/SearchableSelect";

import "./EmployeeSubmit.css";
// Employee Submit page that allows employees to submit a referral for a candidate.
// It includes a form to enter the candidate's details, upload their CV, and select the position they are being referred for.
// The page also fetches and displays details about the selected position, and checks if the candidate's email already exists in the system to prefill their information if available.
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
    phoneNumber: "",
    experience: "",
    positionId: "",
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // for referring from the positions page
  const [searchParams] = useSearchParams();
  const preselectedPositionId = searchParams.get("positionId");

  // for submit button
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [errors, setErrors] = useState({});

  // for getting the position details
  const [positionDetails, setPositionDetails] = useState(null);
  const [positionDetailsError, setPositionDetailsError] = useState("");
  const [loadingPositionDetails, setLoadingPositionDetails] = useState(false);

  // for checking if the email exists already and it asks to prefill its info
  const [showPrefillModal, setShowPrefillModal] = useState(false);
  const [existingCandidate, setExistingCandidate] = useState(null);
  const [emailChecked, setEmailChecked] = useState(false);

  const fetchCvAsFile = async (cvUrl, filename) => {
    const res = await fetch(cvUrl);
    if (!res.ok) throw new Error("Failed to fetch CV");

    const blob = await res.blob();

    return new File([blob], filename, {
      type: blob.type || "application/pdf",
    });
  };

  useEffect(() => {
    const loadPositionDetails = async () => {
      if (!form.positionId) {
        setPositionDetails(null);
        return;
      }

      setLoadingPositionDetails(true);
      setPositionDetailsError("");

      try {
        const res = await getPositionDetails(form.positionId);

        if (res.error) {
          setPositionDetailsError(res.error);
          setPositionDetails(null);
        } else {
          setPositionDetails(res);
        }
      } catch (err) {
        setPositionDetailsError("Failed to load position details");
        setPositionDetails(null);
      } finally {
        setLoadingPositionDetails(false);
      }
    };

    loadPositionDetails();
  }, [form.positionId]);

  const isFormDirty = () => {
    return (
      form.firstName ||
      form.lastName ||
      form.email ||
      form.phoneNumber ||
      form.experience ||
      form.positionId ||
      cvFile
    );
  };
  const [pendingHref, setPendingHref] = useState(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!isFormDirty()) return;

      const link = e.target.closest("a");
      if (!link || !link.href) return;

      // same-page anchors / external links optional
      if (link.target === "_blank") return;

      e.preventDefault();
      setPendingHref(link.href);
      setShowResetConfirm(true);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [form, cvFile]);

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
    if (!form.phoneNumber) newErrors.phoneNumber = "Phone number is required";

    if (!form.experience) newErrors.experience = "Experience is required";
    if (!cvFile) newErrors.cvFile = "CV is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // for position fetching - fetch ALL positions by paginating through all pages
  useEffect(() => {
    const loadPositions = async () => {
      setLoadingPositions(true);
      setPositionsError("");

      try {
        let allPositions = [];
        let currentPage = 1;
        let hasMorePages = true;
        const pageSize = 50; // Max limit from backend

        // Fetch all pages until we get all positions
        while (hasMorePages) {
          const result = await fetchVisiblePositions({
            page: currentPage,
            pageSize: pageSize,
          });

          if (result.error) {
            setPositionsError(result.error);
            break;
          }

          if (result.positions && result.positions.length > 0) {
            const merged = [...allPositions, ...result.positions];

            allPositions = Array.from(
              new Map(merged.map((p) => [p.PositionId, p])).values(),
            );
          }

          // Check if there are more pages
          // Stop if no more pages OR if we got no results
          hasMorePages =
            result.hasNextPage === true &&
            result.positions &&
            result.positions.length > 0;
          currentPage++;

          // Safety check to prevent infinite loops
          if (currentPage > 100) {
            console.warn("Reached maximum page limit while fetching positions");
            break;
          }
        }

        setPositions(allPositions);

        //  PRESELECT POSITION FROM URL
        if (preselectedPositionId) {
          setForm((prev) => ({
            ...prev,
            positionId: preselectedPositionId,
          }));
        }
      } catch (error) {
        setPositionsError(error.message || "Failed to load positions");
      } finally {
        setLoadingPositions(false);
      }
    };

    loadPositions();
  }, [preselectedPositionId]);

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
      phoneNumber: "",
      experience: "",
      positionId: "",
    });

    setCvFile(null);
    setCvError("");
    setPositionsError("");
    setShowResetConfirm(false);

    if (pendingHref) {
      window.location.href = pendingHref;
    }
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

  useEffect(() => {
    const email = form.email.trim();

    if (!email) {
      setExistingCandidate(null);
      setShowPrefillModal(false);
      setEmailChecked(false);
      return;
    }

    if (emailChecked) return;

    const checkEmail = async () => {
      try {
        const res = await checkCandidateByEmail(email);
        // res = { exists, candidate }

        if (res.exists && res.candidate) {
          setExistingCandidate(res.candidate);
          setShowPrefillModal(true);
        }

        setEmailChecked(true);
      } catch (err) {
        console.error("Email check failed", err);
      }
    };

    const t = setTimeout(checkEmail, 400);
    return () => clearTimeout(t);
  }, [form.email, emailChecked]);
  const handlePrefillYes = async () => {
    if (!existingCandidate) return;

    setForm((prev) => ({
      ...prev,
      firstName: existingCandidate.FirstName ?? "",
      lastName: existingCandidate.LastName ?? "",
      phoneNumber: existingCandidate.PhoneNumber ?? "",
      experience: String(existingCandidate.YearOfExperience ?? ""),
      email: existingCandidate.Email ?? prev.email,
    }));

    if (existingCandidate.CVUrl) {
      try {
        const fileName = `${existingCandidate.FirstName}-${existingCandidate.LastName}-CV.pdf`;
        const file = await fetchCvAsFile(existingCandidate.CVUrl, fileName);
        setCvFile(file);
        setCvError("");
      } catch {
        setCvError("Failed to load existing CV");
      }
    }

    setEmailChecked(true);
    setShowPrefillModal(false);
  };

  const handlePrefillNo = () => {
    setEmailChecked(true);
    setShowPrefillModal(false);
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
        {positionsError && <p className="errorText">{positionsError}</p>}

        <SearchableSelect
          options={positions.map((pos) => ({
            value: pos.PositionId,
            label: `${pos.PositionTitle} - ${pos.CompanyName}`,
          }))}
          value={form.positionId}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, positionId: value }))
          }
          placeholder="Select a position"
          disabled={loadingPositions}
          loading={loadingPositions}
        />
        {errors.positionId && <p className="errorText">{errors.positionId}</p>}
      </div>
      {/* Position Details */}
      {form.positionId && (
        <div className="employeeSubmit-card">
          <h4>Position Details</h4>
          <p>Information about the selected position</p>

          {loadingPositionDetails && (
            <p className="employeeSubmit-muted">Loading position details...</p>
          )}

          {positionDetailsError && (
            <p className="errorText">{positionDetailsError}</p>
          )}

          {positionDetails && (
            <div className="employeeSubmit-detailsGrid">
              <div className="employeeSubmit-detailItem">
                <span className="employeeSubmit-detailLabel">Department</span>
                <span className="employeeSubmit-detailValue">
                  {positionDetails.Department.DepartmentName || "-"}
                </span>
              </div>

              <div className="employeeSubmit-detailItem">
                <span className="employeeSubmit-detailLabel">Location</span>
                <span className="employeeSubmit-detailValue">
                  {positionDetails.PositionLocation || "-"}
                </span>
              </div>

              <div className="employeeSubmit-detailItem">
                <span className="employeeSubmit-detailLabel">Job Type</span>
                <span className="employeeSubmit-detailValue">
                  {positionDetails.EmploymentType || "-"}
                </span>
              </div>

              <div className="employeeSubmit-detailItem">
                <span className="employeeSubmit-detailLabel">
                  Required Experience
                </span>
                <span className="employeeSubmit-detailValue">
                  {positionDetails.YearsRequired
                    ? `${positionDetails.YearsRequired} years`
                    : "-"}
                </span>
              </div>

              <div className="employeeSubmit-detailItem">
                <span className="employeeSubmit-detailLabel">
                  Position Timezone
                </span>
                <span className="employeeSubmit-detailValue">
                  {positionDetails.Timezone || "-"}
                </span>
              </div>

              <div className="employeeSubmit-detailItem">
                <span className="employeeSubmit-detailLabel">
                  Application Deadline
                </span>
                <span className="employeeSubmit-detailValue">
                  {positionDetails.Deadline
                    ? new Date(positionDetails.Deadline).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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
              Phone Number <span>*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              className="employeeSubmit-input"
              placeholder="03060846"
            />

            {errors.phoneNumber && (
              <p className="errorText">{errors.phoneNumber}</p>
            )}
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
          <div className="employeeSubmit-field employeeSubmit-fullWidth">
            <label className="employeeSubmit-label">
              Email <span>*</span>
            </label>
            <input
              name="email"
              value={form.email}
              onChange={(e) => {
                setEmailChecked(false);
                handleChange(e);
              }}
              className="employeeSubmit-input"
              placeholder="you@example.com"
            />

            {errors.email && <p className="errorText">{errors.email}</p>}
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
                onClick={() => {
                  setShowResetConfirm(false);
                  setPendingHref(null);
                }}
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
      {showPrefillModal && (
        <div className="employeeSubmit-modalOverlay">
          <div className="employeeSubmit-modal">
            <h3>Candidate already exists</h3>
            <p>
              A candidate with this email already exists.
              <br />
              Do you want to prefill their information?
            </p>

            <div className="employeeSubmit-modalActions">
              <button
                className="employeeSubmit-cancel"
                onClick={handlePrefillNo}
              >
                No
              </button>

              <button
                className="employeeSubmit-confirm"
                onClick={handlePrefillYes}
              >
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
