const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";

export const createDepartment = async (name) => {
  const res = await fetch(`${API_BASE_URL}/hr/department`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create department");
  }

  return res.json();
};

