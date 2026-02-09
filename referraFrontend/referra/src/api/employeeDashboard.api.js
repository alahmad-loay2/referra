const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";

/**
 * Get employee dashboard data
 * - stats
 * - recent referrals
 * - recent open positions
 */
export const getEmployeeDashboard = async () => {
  const res = await fetch(`${API_BASE_URL}/employee/dashboard`, {
    method: "GET",
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
    throw new Error(data.message || "Failed to fetch employee dashboard");
  }

  return data;
};
