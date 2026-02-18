import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signup } from "../../../api/auth.api.js";
import NormalSelect from "../../../components/normalSelect/NormalSelect";
import "./Register.css";
// Register page that allows new employees to create an account by filling out a registration form with their personal and work details.
// It shows a loading state while the request is being processed and displays error messages based on the API response.
//  It also has a toggle to show/hide the password and a link to the login page.
const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    phoneNumber: "",
    gender: "",
    email: "",
    password: "",
    department: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  useEffect(() => {
    setDepartments([
      { id: "engineering", name: "Engineering" },
      { id: "sales", name: "Sales" },
      { id: "marketing", name: "Marketing" },
      { id: "hr", name: "Human Resources" },
    ]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        age: form.age,
        phoneNumber: form.phoneNumber,
        gender: form.gender,
        email: form.email,
        password: form.password,
        department: form.department,
      };
      const result = await signup(payload);
      // Check if there's an error in the response
      if (result.error) {
        setMessage(result.error);
        setLoading(false);
      } else {
        // On success, redirect to signup verification
        navigate("/auth/signup-verification");
      }
    } catch (err) {
      setMessage(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* LEFT */}
      <div className="register-left">
        <h1>Join our Referral Program</h1>
        <p>
          Help us grow by referring talented people you know. It’s simple,
          rewarding, and impactful.
        </p>

        <ul className="features">
          <li>
            <CheckCircle size={18} />
            <span>Submit referrals in minutes</span>
          </li>
          <li>
            <CheckCircle size={18} />
            <span>Track your candidate progress</span>
          </li>
          <li>
            <CheckCircle size={18} />
            <span>Earn bonuses for successful hires</span>
          </li>
          <li>
            <CheckCircle size={18} />
            <span>Help build your dream team</span>
          </li>
        </ul>
      </div>
      {/* RIGHT */}
      <div className="register-right">
        <div className="form-card">
          <img src="/logo.svg" alt="Aspire Software" className="logo" />

          <h2>Create your account</h2>
          <p className="subtitle">
            Register as an employee to start referring candidates
          </p>

          {message && <div className="message">{message}</div>}
          <form onSubmit={handleSubmit}>
            {/* NAMES */}
            <div className="row">
              <div className="field">
                <label>First Name *</label>
                <input
                  name="firstName"
                  placeholder="John"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  maxLength={50}
                />
              </div>

              <div className="field">
                <label>Last Name *</label>
                <input
                  name="lastName"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  maxLength={50}
                />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Gender *</label>
                <NormalSelect
                  name="gender"
                  value={form.gender}
                  onChange={(val) =>
                    setForm((prev) => ({ ...prev, gender: val }))
                  }
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" },
                  ]}
                  placeholder="Select gender"
                  required
                />
              </div>

              <div className="field">
                <label>Age*</label>
                <input
                  name="age"
                  type="number"
                  placeholder="20"
                  value={form.age}
                  onChange={handleChange}
                  required
                  min={1}
                  max={150}
                />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Phone Number *</label>
                <input
                  name="phoneNumber"
                  placeholder="123-456-7890"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                  maxLength={32}
                />
              </div>

              <div className="field">
                <label>Department *</label>
                <NormalSelect
                  name="department"
                  value={form.department}
                  onChange={(val) =>
                    setForm((prev) => ({ ...prev, department: val }))
                  }
                  options={departments.map((dep) => ({
                    value: dep.id,
                    label: dep.name,
                  }))}
                  placeholder="Select department"
                  required
                />
              </div>
            </div>
            {/* EMAIL */}
            <div className="field">
              <label>Work Email *</label>
              <div className="input-icon">
                <Mail size={16} />
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  maxLength={255}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="field">
              <label>Password *</label>
              <div className="input-icon">
                <Lock size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  maxLength={128}
                />
                <span
                  className="eye"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
              </div>
            </div>

            {/* CONFIRM */}
            <div className="field">
              <label>Confirm Password *</label>
              <div className="input-icon">
                <Lock size={16} />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  maxLength={128}
                />
                <span className="eye" onClick={() => setShowConfirm((p) => !p)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
              </div>
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
          <p className="footer-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
