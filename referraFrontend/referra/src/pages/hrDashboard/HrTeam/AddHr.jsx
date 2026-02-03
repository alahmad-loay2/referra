import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createHr } from "../../../api/auth.api";
import { getHrDepartments } from "../../../api/hrPositions.api";
import "./AddHr.css";

const AddHr = ({ onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getHrDepartments();
        setDepartments(data);
      } catch {
        setError("Failed to load departments");
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async () => {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !age ||
      !phoneNumber ||
      !gender ||
      !departmentId
    ) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      await createHr({
        firstName,
        lastName,
        email,
        age,
        phoneNumber,
        gender,
        departmentId,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create HR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <h2>Add New HR Team Member</h2>
        <p className="modal-subtitle">
          They will receive an email to set their password.
        </p>

        <form>
          {/* FIRST + LAST NAME */}
          <div className="modal-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input
                name="hr-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                name="hr-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label>Email *</label>
            <input
              name="hr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* AGE */}
          <div className="form-group">
            <label>Age *</label>
            <input
              name="hr-age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          {/* PHONE */}
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              name="hr-phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          {/* GENDER */}
          <div className="form-group">
            <label>Gender *</label>
            <input
              name="hr-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            />
          </div>

          {/* DEPARTMENT */}
          <div className="form-group">
            <label>Assigned Department *</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.DepartmentId} value={d.DepartmentId}>
                  {d.DepartmentName}
                </option>
              ))}
            </select>
          </div>
        </form>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHr;
