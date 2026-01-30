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
export const fetchEmployeeApplications = async ({
  page,
  pageSize,
  search,
  status,
  createdAt,
} = {}) => {
  const params = new URLSearchParams();

  if (page) params.append("page", page);
  if (pageSize) params.append("pageSize", pageSize);
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  if (createdAt) params.append("createdAt", createdAt);

  const res = await fetch(
    `${API_BASE_URL}/employee/applications?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

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

export const fetchEmployeeReferralDetails = async (referralId) => {
  const res = await fetch(
    `${API_BASE_URL}/employee/referrals/${referralId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const data = await res.json();

  return data;
};

export const editCandidate = async (candidateId, form, cvFile) => {
  const formData = new FormData();

  formData.append("candidateFirstName", form.firstName);
  formData.append("candidateLastName", form.lastName);
  formData.append("candidateEmail", form.email);
  formData.append("candidateYearOfExperience", form.experience);
  if (cvFile) {
    formData.append("cvFile", cvFile);
  }

  const res = await fetch(`${API_BASE_URL}/employee/candidate/${candidateId}`, {
    method: "PUT",
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
    throw new Error(data.message || "Failed to edit candidate");
  }

  return data;
};

export const deleteCandidate = async (referralId) => {
  const res = await fetch(`${API_BASE_URL}/employee/referral/${referralId}`, {
    method: "DELETE",
    credentials: "include",
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
    throw new Error(data.message || "Failed to delete referral");
  }

  return data;
};