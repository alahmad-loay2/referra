import React, { useState } from "react";
import { createHr } from "../../../api/auth.api.js";

const HrTeam = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  const handleCreateHr = async () => {
    try {
      await createHr({
        firstName,
        lastName,
        age,
        phoneNumber,
        gender,
        email,
      });
      setFirstName("");
      setLastName("");
      setAge("");
      setPhoneNumber("");
      setGender("");
      setEmail("");
      setCreateMessage("HR created successfully.");
    } catch (e) {
      setCreateMessage("Failed to create HR.");
    }
  };

  return (
    <div>
      <h1>HR Team</h1>
      <button onClick={handleCreateHr}>Create New HR</button>
      <div>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="Gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {createMessage && <p>{createMessage}</p>}
    </div>
  );
};

export default HrTeam;

