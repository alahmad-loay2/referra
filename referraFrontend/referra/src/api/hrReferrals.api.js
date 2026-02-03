const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";

export const getReferrals = async ({
  page = 1,
  pageSize = 10,
  status = "",
  search = "",
  createdAt = "",
  positionId = "",
} = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("pageSize", pageSize); 
  if (status) params.append("status", status);
  if (search) params.append("search", search);
  if (createdAt) params.append("createdAt", createdAt);
  if (positionId) params.append("positionId", positionId);

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

export const advanceReferralStage = async (referralId) => {
  if (!referralId) throw new Error("Referral ID is required");

  try {
    const res = await fetch(`${API_BASE_URL}/hr/referrals/${referralId}/advance`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to advance referral stage");
    }

    return await res.json();
  } catch (error) {
    throw error;
  }
};

export const finalizeReferral = async (referralId, action, compensation = 0) => {
  if (!referralId || !action) throw new Error("Referral ID and action are required");

  try {
    const res = await fetch(`${API_BASE_URL}/hr/referrals/${referralId}/finalize`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, compensation }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to finalize referral");
    }

    return await res.json();
  } catch (error) {
    throw error;
  }
};