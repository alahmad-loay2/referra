const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";

/**
 * Advance referral stage
 * PATCH /hr/referrals/:referralId/advance
 */
export const advanceReferralStage = async (referralId) => {
  const res = await fetch(
    `${API_BASE_URL}/hr/referrals/${referralId}/advance`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to advance referral");
  }

  return res.json();
};

/**
 * Finalize referral (Accept / Prospect)
 * PATCH /hr/referrals/:referralId/finalize
 */
export const finalizeReferral = async (
  referralId,
  action,
  compensation = 0,
) => {
  const res = await fetch(
    `${API_BASE_URL}/hr/referrals/${referralId}/finalize`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, compensation }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to finalize referral");
  }

  return res.json();
};
