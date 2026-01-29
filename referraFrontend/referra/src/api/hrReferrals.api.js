const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";

  export const getReferrals = async ({
  page = 1,
  pageSize = 10,
  status = "",
  search = "",
  createdAt = "",
} = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("pageSize", pageSize); 
  if (status) params.append("status", status);
  if (search) params.append("search", search);
  if (createdAt) params.append("createdAt", createdAt);

  try {
    const res = await fetch(`${API_BASE_URL}/hr/referrals?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return await res.json();
  } catch (error) {
    throw error;
  }
};