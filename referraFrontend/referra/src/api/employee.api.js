const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";
export const submitReferral = async (form, cvFile) => {
  const formData = new FormData();

  formData.append("candidateFirstName", form.firstName);
  formData.append("candidateLastName", form.lastName);
  formData.append("candidateEmail", form.email);
  formData.append("candidateYearOfExperience", form.experience);
  formData.append("positionId", form.positionId);
  formData.append("cvFile", cvFile);

  const res = await fetch(`${API_BASE_URL}/employee/referral`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Server error");
  }

  if (!res.ok) {
    throw new Error(data.message || "Failed to submit referral");
  }

  return data;
};

export const fetchEmployeeApplications = async (params = {}) => {
  const query = new URLSearchParams(params).toString();

  const res = await fetch(`${API_BASE_URL}/employee/applications?${query}`, {
    method: "GET",
    credentials: "include", // ✅ THIS is the key
    headers: {
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Server error");
  }

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch referrals");
  }

  return data;
};
