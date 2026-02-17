import React, { useState, useEffect } from "react";
import "./HrCreatePosition.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createPosition,
  updatePosition,
  getPositionDetails,
  getHrDepartments,
} from "../../../api/hrPositions.api";
import SearchableSelect from "../../../components/searchableSelect/SearchableSelect";
// Hr Create Position page that allows HR users to create a new job position or edit an existing one.
// The form includes fields for job title, company name, employment type, years of experience required, job description, time zone, deadline, location, and department.
// The page fetches the list of departments for the department dropdown and the position details if in edit mode.
// It also includes validation for required fields and deadline date.
const HrCreatePosition = () => {
  const navigate = useNavigate();
  const { positionId } = useParams();
  const isEditMode = !!positionId;

  const [formData, setFormData] = useState({
    positionTitle: "",
    companyName: "",
    employmentType: "",
    yearsRequired: "",
    description: "",
    timeZone: "",
    deadline: "",
    positionLocation: "",
    positionState: "OPEN",
    departmentId: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const depts = await getHrDepartments();
        setDepartments(depts);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const fetchPositionData = async () => {
        try {
          setLoadingData(true);
          const position = await getPositionDetails(positionId);

          // Format deadline date for input
          const deadlineDate = position.Deadline
            ? new Date(position.Deadline).toISOString().split("T")[0]
            : "";

          setFormData({
            positionTitle: position.PositionTitle || "",
            companyName: position.CompanyName || "",
            employmentType: position.EmploymentType || "",
            yearsRequired: position.YearsRequired || "",
            description: position.Description || "",
            timeZone: position.Timezone || "",
            deadline: deadlineDate,
            positionLocation: position.PositionLocation || "",
            positionState: position.PositionState || "OPEN",
            departmentId: position.DepartmentId?.toString() || "",
          });
        } catch (err) {
          setError("Failed to load position data");
        } finally {
          setLoadingData(false);
        }
      };

      fetchPositionData();
    }
  }, [positionId, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const deadlineDate = new Date(formData.deadline);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (deadlineDate < tomorrow) {
      setError("Deadline must be at least tomorrow.");
      setLoading(false);
      return;
    }

    if (!formData.departmentId) {
      setError("Department is required.");
      setLoading(false);
      return;
    }
    if (!formData.employmentType) {
      setError("Employment type is required.");
      setLoading(false);
      return;
    }

    if (!formData.timeZone) {
      setError("Time zone is required.");
      setLoading(false);
      return;
    }

    try {
      if (isEditMode) {
        await updatePosition(positionId, formData);
      } else {
        await createPosition(formData);
      }
      setLoading(false);
      navigate("/dashboard/hr/positions");
    } catch (err) {
      setLoading(false);
      setError(
        isEditMode ? "Failed to update position" : "Failed to create position",
      );
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setShowCancelConfirm(true);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    navigate("/dashboard/hr/positions");
  };

  const hasFormData = () => {
    return (
      formData.positionTitle ||
      formData.companyName ||
      formData.employmentType ||
      formData.yearsRequired ||
      formData.description ||
      formData.timeZone ||
      formData.deadline ||
      formData.positionLocation ||
      formData.departmentId
    );
  };
  const getTomorrowDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  };

  const departmentOptions = departments.map((dept) => ({
    value: dept.DepartmentId,
    label: dept.DepartmentName,
  }));
  const employmentTypeOptions = [
    { value: "FULL_TIME", label: "Full Time" },
    { value: "PART_TIME", label: "Part Time" },
    { value: "CONTRACT", label: "Contract" },
    { value: "INTERNSHIP", label: "Internship" },
    { value: "TEMPORARY", label: "Temporary" },
  ];
  const [timeZones, setTimeZones] = useState([]);
  useEffect(() => {
    const zones = Intl.supportedValuesOf("timeZone");

    const formatted = zones.map((zone) => {
      const now = new Date();

      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        timeZoneName: "shortOffset",
      });

      const parts = formatter.formatToParts(now);
      const offsetPart = parts.find((p) => p.type === "timeZoneName");

      const gmtValue = offsetPart?.value || "GMT";
      const fullLabel = `${zone.replace(/_/g, " ")} - ${gmtValue}`;

      return {
        value: fullLabel, // Save full label including GMT
        label: fullLabel,
        zone: zone, // Keep zone identifier for matching
      };
    });

    setTimeZones(formatted.sort((a, b) => a.label.localeCompare(b.label)));
  }, []);

  const [countries, setCountries] = useState([]);
  useEffect(() => {
    // Generate all possible two-letter combinations (AA-ZZ)
    const countryCodes = [];
    for (let first = 65; first <= 90; first++) {
      for (let second = 65; second <= 90; second++) {
        countryCodes.push(String.fromCharCode(first) + String.fromCharCode(second));
      }
    }
    
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

    const formatted = countryCodes
      .map((code) => {
        try {
          const name = displayNames.of(code);
          // Filter out codes that return the same code (invalid) or contain numbers/special chars
          if (name && name !== code && name.length > 0) {
            return {
              value: name,
              label: name,
            };
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label));

    setCountries(formatted);
  }, []);

  // Update timezone value when timeZones are loaded (for edit mode)
  useEffect(() => {
    if (isEditMode && formData.timeZone && timeZones.length > 0) {
      // Check if current timeZone value is just the zone identifier (doesn't contain "–")
      const isFullLabel = formData.timeZone.includes("-");
      if (!isFullLabel) {
        // Find matching timezone and update to full label
        const matchingTz = timeZones.find((tz) => tz.zone === formData.timeZone);
        if (matchingTz) {
          setFormData((prev) => ({
            ...prev,
            timeZone: matchingTz.value,
          }));
        }
      }
    }
  }, [timeZones, isEditMode]);

  return (
    <div className="HrCreatePosition">
      <div className="CreatePositionContainer">
        <div className="createPositionHeader">
          <Link to="/dashboard/hr/positions" onClick={handleBack}>
            &lt;-
          </Link>
          <h3>{isEditMode ? "Edit Position" : "Create New Position"}</h3>
        </div>
        <p>
          {isEditMode
            ? "Update the job opening details"
            : "Add a new job opening for your department"}
        </p>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loadingData && <p>Loading position data...</p>}

        <form
          className="formContainer"
          onSubmit={handleSubmit}
          style={{
            opacity: loadingData ? 0.5 : 1,
            pointerEvents: loadingData ? "none" : "auto",
          }}
        >
          <div className="positionFormGrid">
            {/* Row 1 */}
            <div className="labelInput">
              <label>Job Title*</label>
              <input
                type="text"
                name="positionTitle"
                placeholder="e.g. Software Engineer"
                required
                value={formData.positionTitle}
                onChange={handleChange}
              />
            </div>
            <div className="labelInput">
              <label>Company Name*</label>
              <input
                type="text"
                name="companyName"
                placeholder="e.g. Tech Corp"
                required
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>
            <div className="labelInput">
              <label>Years Of Experience Needed*</label>
              <input
                type="number"
                name="yearsRequired"
                placeholder="e.g. 2"
                required
                value={formData.yearsRequired}
                onChange={handleChange}
              />
            </div>

            {/* Row 2 */}
            <div className="labelInput">
              <label>Employment Type*</label>
              <SearchableSelect
                options={employmentTypeOptions}
                value={formData.employmentType}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    employmentType: val,
                  }))
                }
                placeholder="Employment Type"
                searchPlaceholder="Search employment types..."
                noResultsText="No employment types found"
              />
            </div>

            <div className="labelInput">
              <label>Location*</label>
              <SearchableSelect
                options={countries}
                value={formData.positionLocation}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    positionLocation: val,
                  }))
                }
                placeholder="Select Country"
                searchPlaceholder="Search countries..."
                noResultsText="No countries found"
              />
            </div>

            <div className="labelInput">
              <label>Time Zone*</label>
              <SearchableSelect
                options={timeZones}
                value={formData.timeZone}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeZone: val,
                  }))
                }
                placeholder="Select Time Zone"
                searchPlaceholder="Search time zones..."
                noResultsText="No time zones found"
              />
            </div>

            {/* Row 3 */}
            <div className="labelInput">
              <label>Department*</label>
              <SearchableSelect
                options={departmentOptions}
                value={formData.departmentId}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    departmentId: val,
                  }))
                }
                placeholder="Select Department"
                searchPlaceholder="Search departments..."
                noResultsText="No departments found"
                loading={loadingData}
              />
            </div>

            <div className="labelInput">
              <label>Deadline*</label>
              <input
                type="date"
                name="deadline"
                required
                min={getTomorrowDate()}
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="formGroup description">
            <div className="labelInput">
              <label>Description*</label>
              <textarea
                name="description"
                placeholder="e.g. Techstack needed + work environment"
                required
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="buttonGroup">
            <button type="button" className="cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="create"
              disabled={loading || loadingData}
            >
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Position"
                  : "Create Position"}
            </button>
          </div>
        </form>
      </div>

      {showCancelConfirm && (
        <div className="createPosition-modalOverlay">
          <div className="createPosition-modal">
            <h3>Leave without saving?</h3>
            <p>
              Are you sure you want to leave? All unsaved changes will be lost.
            </p>

            <div className="createPosition-modalActions">
              <button
                className="createPosition-cancel"
                onClick={() => setShowCancelConfirm(false)}
              >
                Cancel
              </button>

              <button
                className="createPosition-confirm"
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

export default HrCreatePosition;
