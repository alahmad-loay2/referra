import React, { useState, useEffect } from "react";
import { createHr } from "../../../api/auth.api.js";
import { getHrDepartments } from "../../../api/hrPositions.api.js";

const HrTeam = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [createMessage, setCreateMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const depts = await getHrDepartments();
        setDepartments(depts);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        setCreateMessage("Failed to load departments.");
      }
    };
    fetchDepartments();
  }, []);

  const handleCreateHr = async () => {
    if (!departmentId) {
      setCreateMessage("Please select a department.");
      return;
    }

    setLoading(true);
    setCreateMessage("");
    try {
      await createHr({
        firstName,
        lastName,
        age,
        phoneNumber,
        gender,
        email,
        departmentId,
      });
      setFirstName("");
      setLastName("");
      setAge("");
      setPhoneNumber("");
      setGender("");
      setEmail("");
      setDepartmentId("");
      setCreateMessage("HR created successfully.");
    } catch (e) {
      setCreateMessage(e.message || "Failed to create HR.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>HR Team</h1>
      <button onClick={handleCreateHr} disabled={loading}>
        {loading ? "Creating..." : "Create New HR"}
      </button>
      <div>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          required
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.DepartmentId} value={dept.DepartmentId}>
              {dept.DepartmentName}
            </option>
          ))}
        </select>
      </div>
      {createMessage && <p>{createMessage}</p>}
    </div>
  );
};

export default HrTeam;
