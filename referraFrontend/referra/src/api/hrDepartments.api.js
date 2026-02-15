import { generateIdempotencyKey } from "./idempotency.utils.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";

// api to create a department for admin HR
export const createDepartment = async (name) => {
  const body = { name };
  const res = await fetch(`${API_BASE_URL}/hr/department`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": await generateIdempotencyKey("/hr/department", body),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create department");
  }

  return res.json();
};
