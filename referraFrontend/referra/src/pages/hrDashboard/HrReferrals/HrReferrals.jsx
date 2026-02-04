import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./HrReferrals.css";
import { Search } from "lucide-react";
import { getReferrals } from "../../../api/hrReferrals.api.js";
import { getHrPositions } from "../../../api/hrPositions.api.js";
import { Mail, Briefcase, MapPin } from "lucide-react";
import Loading from "../../../components/loading/Loading.jsx";
import { getPaginationPages } from "../../../utils/pagination";
import SearchableSelect from "../../../components/searchableSelect/SearchableSelect";

const HrReferrals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hrReferrals, setHrReferrals] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 9;
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [positionId, setPositionId] = useState("");
  const [positions, setPositions] = useState([]);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    createdAt: "",
    positionId: "",
  });

  // Read positionId and search from URL params on mount
  useEffect(() => {
    const urlPositionId = searchParams.get("positionId");
    const urlSearch = searchParams.get("search");

    if (urlSearch) {
      setSearchInput(urlSearch);
      setFilters((prev) => ({ ...prev, search: urlSearch }));
    }

    if (urlPositionId) {
      setPositionId(urlPositionId);
      setFilters((prev) => ({ ...prev, positionId: urlPositionId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch positions for dropdown - fetch ALL positions by paginating through all pages
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        let allPositions = [];
        let currentPage = 1;
        let hasMorePages = true;
        const pageSize = 50; // Max limit from backend

        // Fetch all pages until we get all positions
        while (hasMorePages) {
          const data = await getHrPositions({
            page: currentPage,
            limit: pageSize,
          });

          if (data && data.positions && data.positions.length > 0) {
            allPositions = [...allPositions, ...data.positions];
          }

          // Check if there are more pages
          // Calculate hasNextPage from totalPages and current page
          const hasNextPage =
            data?.totalPages && currentPage < data.totalPages;
          hasMorePages =
            hasNextPage === true &&
            data?.positions &&
            data.positions.length > 0;
          currentPage++;

          // Safety check to prevent infinite loops
          if (currentPage > 100) {
            console.warn("Reached maximum page limit while fetching positions");
            break;
          }
        }

        setPositions(allPositions);
      } catch (err) {
        console.error("Failed to fetch positions", err);
      }
    };
    fetchPositions();
  }, []);

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
          positionId: filters.positionId,
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
    const newFilters = {
      search: searchInput,
      status,
      createdAt: date,
      positionId,
    };
    setFilters(newFilters);

    const params = {};
    if (positionId) params.positionId = positionId;
    if (searchInput) params.search = searchInput;

    setSearchParams(params);
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const goNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const goPrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const getVisiblePages = () => {
    return getPaginationPages(page, totalPages);
  };

  const getStatusBadge = (referral) => {
    const status = referral?.Referral?.Status;
    const prospect = referral?.Referral?.Prospect;
    const acceptedInOtherPosition = referral?.Referral?.AcceptedInOtherPosition;
    const candidateAcceptance = referral?.Candidate?.Acceptance;

    // If accepted in other position, show that badge
    if (acceptedInOtherPosition) {
      return { text: "Accepted in Other Position", className: "status-badge-accepted-other" };
    }

    // If status is Hired, show Accepted
    if (status === "Hired") {
      return { text: "Accepted", className: "status-badge-accepted" };
    }

    // If Prospect is true, show Prospect badge
    if (prospect) {
      return { text: "Prospect", className: "status-badge-prospect" };
    }

    // If candidate is accepted but not in Hired status (shouldn't happen but handle it)
    if (candidateAcceptance && status !== "Hired") {
      return { text: "Accepted", className: "status-badge-accepted" };
    }

    // Default: In Progress
    return { text: "In Progress", className: "status-badge-in-progress" };
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
          <SearchableSelect
            options={[
              { value: "", label: "All Positions" },
              ...positions.map((pos) => ({
                value: pos.PositionId,
                label: pos.PositionTitle,
              })),
            ]}
            value={positionId}
            onChange={(value) => setPositionId(value)}
            placeholder="All Positions"
          />
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
            <option value="Hired">Hired</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="apply-btn" onClick={handleApplyFilters}>
            Apply
          </button>
        </div>
      </div>

      <span className="candidateStats">
        {loading
          ? "Loading..."
          : `Showing ${hrReferrals.length} out of ${total} candidates`}
      </span>

      <div className="allCandidates">
        {loading ? (
          <>
            {[...Array(9)].map((_, index) => (
              <div key={`skeleton-${index}`} className="candidate-skeleton">
                <div className="skeleton-card-left">
                  <div className="skeleton-name"></div>
                  <div className="skeleton-email"></div>
                </div>
                <div className="skeleton-card-right">
                  <div className="skeleton-badge"></div>
                  <div className="skeleton-text-small"></div>
                  <div className="skeleton-text-small"></div>
                  <div className="skeleton-button"></div>
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <p style={{ color: "red" }}>Failed to load referrals</p>
        ) : hrReferrals.length === 0 ? (
          <p>No referrals found</p>
        ) : (
          hrReferrals.map((ref) => (
            <div className="candidate" key={ref.id}>
              <div className="cardLeft">
                <div className="hr-referrals-avatar-name">
                  <div className="hr-referrals-avatar">
                    {ref.Candidate?.FirstName?.[0]}
                    {ref.Candidate?.LastName?.[0]}
                  </div>
                  <div className="hr-referrals-name-content">
                    <p>
                      {ref.Candidate?.FirstName} {ref.Candidate?.LastName}
                    </p>

                    <span className="iconText">
                      <Mail size={14} />
                      <span className="iconTextLabel">{ref.Candidate?.Email}</span>
                    </span>
                    {(() => {
                      const badge = getStatusBadge(ref);
                      return (
                        <span className={`statusBadgeSecondary ${badge.className}`}>
                          {badge.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>
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
                <Link
                  to={`/dashboard/hr/referrals/${ref.id || ref.Referral?.ReferralId}`}
                  className="referral-details-btn"
                >
                  Referral Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button className="nav" onClick={goPrev} disabled={page === 1}>
          ← Previous
        </button>

        {getVisiblePages().map((p, i) => {
          if (p === "...") {
            return (
              <button key={`dots-${i}`} className="dots" disabled>
                ...
              </button>
            );
          }
          return (
            <button
              key={p}
              className={p === page ? "active" : ""}
              onClick={() => goToPage(p)}
            >
              {p}
            </button>
          );
        })}

        <button className="nav" onClick={goNext} disabled={page === totalPages}>
          Next →
        </button>
      </div>
    </div>
  );
};

export default HrReferrals;
