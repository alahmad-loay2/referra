const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";

export const getHrTeam = async ({
  page = 1,
  limit = 10,
  search = "",
  departmentId = "",
} = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (departmentId) params.append("departmentId", departmentId);

  const res = await fetch(`${API_BASE_URL}/hr/team?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Failed to fetch HR team");
  return res.json();
};
