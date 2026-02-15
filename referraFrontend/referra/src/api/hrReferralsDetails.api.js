const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";
// API to get referral details for HR referral details page
export const getReferralDetails = async (referralId) => {
  if (!referralId) throw new Error("Referral ID is required");

  try {
    const res = await fetch(
      `${API_BASE_URL}/hr/referrals/${referralId}/details`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch referral details");
    }

    return await res.json();
  } catch (error) {
    throw error;
  }
};
