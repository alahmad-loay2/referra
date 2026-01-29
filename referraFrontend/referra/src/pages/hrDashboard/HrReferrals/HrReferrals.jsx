import React, { useEffect, useState } from "react";
import Button from "../../../components/button/Button";
import Loading from "../../../components/loading/Loading.jsx";
import "./HrReferrals.css";
import { Search } from "lucide-react";
import { getReferrals } from "../../../api/hrReferrals.api.js";
import { Mail, Briefcase, MapPin } from "lucide-react";

const HrPositions = () => {
  const [hrReferrals, setHrReferrals] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 9;
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    createdAt: "",
  });

  useEffect(() => {
    const fetchReferrals = async () => {
      setLoading(true);
      try {
        setError(false);
        const data = await getReferrals({
          page,
          pageSize,
          total,
          status: filters.status,
          search: filters.search,
          createdAt: filters.createdAt,
        });
        setHrReferrals(data.referrals || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("Failed to fetch referrals", err);
        setHrReferrals([]);
        setTotalPages(1);
        setError(true);
      }
      setLoading(false);
    };

    fetchReferrals();
  }, [page, filters]);

  const handleApplyFilters = () => {
    setPage(1);
    setFilters({
      search: searchInput,
      status,
      createdAt: date,
    });
  };

  return (
    <div className="referralHr">
      <h3>Referrals</h3>
      <div className="referralSearchContainer">
        <div className="searchInputWrapper">
          <input
            type="text"
            placeholder="Search for candidate"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search className="searchIcon" size={16} />
        </div>
        <div className="selectContainer">
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Confirmed">Confirmed</option>
            <option value="InterviewOne">Interview One</option>
            <option value="InterviewTwo">Interview Two</option>
            <option value="Acceptance">Acceptance</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button onClick={handleApplyFilters}>apply</button>
        </div>
      </div>

      <span className="candidateStats">
        {loading
          ? "Loading..."
          : `Showing ${hrReferrals.length} out of ${total} candidates`}
      </span>

      <div className="allCandidates">
        {loading ? (
          <Loading />
        ) : error ? (
          <p style={{ color: "red" }}>Failed to load referrals</p>
        ) : hrReferrals.length === 0 ? (
          <p>No referrals found</p>
        ) : (
          hrReferrals.map((ref) => (
            <div className="candidate" key={ref.id}>
              <div className="cardLeft">
                <p>
                  {ref.Candidate?.FirstName} {ref.Candidate?.LastName}
                </p>

                <span className="iconText">
                  <Mail size={14} />
                  <span className="iconTextLabel">{ref.Candidate?.Email}</span>
                </span>
              </div>

              <div className="cardRight">
                <span
                  className={`statusBadge status-${ref.Referral?.Status?.toLowerCase()}`}
                >
                  {ref.Referral?.Status}
                </span>
                <span className="iconText">
                  <Briefcase size={14} />
                  <span className="iconTextLabel">
                    {ref.Position?.PositionTitle}
                  </span>
                </span>

                <span className="iconText">
                  <MapPin size={14} />
                  <span className="iconTextLabel">
                    {ref.Position?.Timezone}
                  </span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default HrPositions;
