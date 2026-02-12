import React, { useState } from "react";
import "./HrDepartment.css";
import { createDepartment } from "../../../api/hrDepartments.api.js";

const HrDepartment = () => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus("Please enter a department name.");
      return;
    }

    try {
      setIsLoading(true);
      setStatus("");
      await createDepartment(name.trim());
      setStatus("Department created successfully.");
      setName("");
    } catch (error) {
      setStatus(error.message || "Failed to create department.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hr-department-page">
      <h3>Departments</h3>
      <form className="hr-department-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Department name"
          className="hr-department-input"
        />
        <button type="submit" className="hr-department-button" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Department"}
        </button>
      </form>
      {status && <p className="hr-department-status">{status}</p>}
    </div>
  );
};

export default HrDepartment;