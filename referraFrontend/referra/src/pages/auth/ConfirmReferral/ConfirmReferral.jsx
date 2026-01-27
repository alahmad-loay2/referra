import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./ConfirmReferral.css";
import Loading from "../../../components/loading/Loading.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";
const ConfirmReferral = () => {
  const { referralId } = useParams();
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const confirmReferral = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/employee/referral/confirm/${referralId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 410) {
            setExpired(true);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to confirm referral");
      } finally {
        setLoading(false);
      }
    };

    if (referralId) {
      confirmReferral();
    } else {
      setLoading(false);
    }
  }, [referralId]);

  if (loading) {
    return <Loading />;
  }

  if (expired) {
    return (
      <div className="confirm-referral-container">
        <p>
          This referral confirmation link has expired. Please contact the person
          who referred you for a new link.
        </p>
      </div>
    );
  }

  return (
    <div className="confirm-referral-container">
      <p>You went through and you can safely close this tab.</p>
    </div>
  );
};

export default ConfirmReferral;
