import React, { useState, useEffect } from "react";
import "./HrCreatePosition.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createPosition, updatePosition, getPositionDetails, getHrDepartments } from "../../../api/hr.api";

const HrCreatePosition = () => {
  const navigate = useNavigate();
  const { positionId } = useParams();
  const isEditMode = !!positionId;

  const [formData, setFormData] = useState({
    positionTitle: "",
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
            ? new Date(position.Deadline).toISOString().split('T')[0]
            : "";

          setFormData({
            positionTitle: position.PositionTitle || "",
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
      setError(isEditMode ? "Failed to update position" : "Failed to create position");
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
      formData.yearsRequired ||
      formData.description ||
      formData.timeZone ||
      formData.deadline ||
      formData.positionLocation ||
      formData.departmentId
    );
  };

  return (
    <div className="HrCreatePosition">
      <div className="CreatePositionContainer">
        <div className="createPositionHeader">
          <Link to="/dashboard/hr/positions" onClick={handleBack}>&lt;-</Link>
          <h3>{isEditMode ? "Edit Position" : "Create New Position"}</h3>
        </div>
        <p>{isEditMode ? "Update the job opening details" : "Add a new job opening for your department"}</p>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loadingData && <p>Loading position data...</p>}

        <form className="formContainer" onSubmit={handleSubmit} style={{ opacity: loadingData ? 0.5 : 1, pointerEvents: loadingData ? 'none' : 'auto' }}>
          <div className="formGroup">
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
          </div>

          <div className="formGroup">
            <div className="labelInput">
              <label>Location*</label>
              <input
                type="text"
                name="positionLocation"
                placeholder="e.g. USA"
                required
                value={formData.positionLocation}
                onChange={handleChange}
              />
            </div>
            <div className="labelInput">
              <label>Department*</label>
              <select
                name="departmentId"
                required
                value={formData.departmentId}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.DepartmentId} value={dept.DepartmentId}>
                    {dept.DepartmentName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="formGroup">
            <div className="labelInput">
              <label>Time Zone*</label>
              <input
                type="text"
                name="timeZone"
                placeholder="e.g. GMT+2"
                required
                value={formData.timeZone}
                onChange={handleChange}
              />
            </div>
            <div className="labelInput">
              <label>Deadline*</label>
              <input
                type="date"
                name="deadline"
                required
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="formGroup">
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
            <button type="submit" className="create" disabled={loading || loadingData}>
              {loading 
                ? (isEditMode ? "Updating..." : "Creating...") 
                : (isEditMode ? "Update Position" : "Create Position")}
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

              <button className="createPosition-confirm" onClick={confirmCancel}>
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
