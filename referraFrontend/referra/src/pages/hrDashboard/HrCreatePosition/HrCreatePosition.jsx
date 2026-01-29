import React, { useState } from "react";
import "./HrCreatePosition.css";
import { Link, useNavigate } from "react-router-dom";
import { createPosition } from "../../../api/hr.api";

const HrCreatePosition = () => {
  const navigate = useNavigate();

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
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createPosition(formData);
      setLoading(false);
      navigate("/dashboard/hr/positions");
    } catch (err) {
      setLoading(false);
      setError("Failed to create position");
    }
  };

  return (
    <div className="HrCreatePosition">
      <div className="CreatePositionContainer">
        <div className="createPositionHeader">
          <Link to="/dashboard/hr/positions">&lt;-</Link>
          <h3>Create New Position</h3>
        </div>
        <p>Add a new job opening for your department</p>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <form className="formContainer" onSubmit={handleSubmit}>
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
              <label>Department ID*</label>
              <input
                type="text"
                name="departmentId"
                placeholder="e.g. 1"
                required
                value={formData.departmentId}
                onChange={handleChange}
              />
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
            <Link to="/dashboard/hr/positions">
              <button type="button" className="cancel">
                Cancel
              </button>
            </Link>
            <button type="submit" className="create" disabled={loading}>
              {loading ? "Creating..." : "Create Position"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HrCreatePosition;
