import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createHr } from "../../../api/auth.api";
import { getHrDepartments } from "../../../api/hrPositions.api";
import NormalSelect from "../../../components/normalSelect/NormalSelect";
import "./AddHr.css";

const AddHr = ({ onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [departmentIds, setDepartmentIds] = useState([]);

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
      departmentIds.length === 0
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
        departmentIds,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create HR");
    } finally {
      setLoading(false);
    }
  };
  const DepartmentMultiSelect = ({ options, value, onChange }) => {
    const [open, setOpen] = useState(false);

    const toggle = (id) => {
      if (value.includes(id)) {
        onChange(value.filter((v) => v !== id));
      } else {
        onChange([...value, id]);
      }
    };

    const selectedLabels = options
      .filter((o) => value.includes(o.value))
      .map((o) => o.label);

    return (
      <div className="dept-select">
        <div className="dept-select-trigger" onClick={() => setOpen((p) => !p)}>
          <span>
            {selectedLabels.length
              ? selectedLabels.join(", ")
              : "Select Departments"}
          </span>
          <span className="dept-select-arrow">▾</span>
        </div>

        {open && (
          <div className="dept-select-dropdown">
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`dept-select-option ${
                  value.includes(opt.value) ? "selected" : ""
                }`}
                onClick={() => toggle(opt.value)}
              >
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  readOnly
                />
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
        <div className="modal-body">
          <form className="modal-form">
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
            {/* DEPARTMENT */}

            <div className="form-group">
              <label>Assigned Department *</label>

              <DepartmentMultiSelect
                options={departments.map((d) => ({
                  value: d.DepartmentId,
                  label: d.DepartmentName,
                }))}
                value={departmentIds}
                onChange={setDepartmentIds}
              />
            </div>

            {/* GENDER */}
            <div className="form-group">
              <label>Gender *</label>
              <NormalSelect
                name="hr-gender"
                value={gender}
                onChange={(val) => setGender(val)}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
                placeholder="Select gender"
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
          </form>
        </div>
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
