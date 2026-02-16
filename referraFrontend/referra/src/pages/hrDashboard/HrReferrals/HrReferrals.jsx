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
import NormalSelect from "../../../components/normalSelect/NormalSelect";

// Hr Referrals page that displays a paginated list of referrals for the HR user, with filters for search, status, date, and position.
// Each referral card shows the candidate's name, email, position referred for, referral date, and a timeline of the referral status.
// It also has badges for prospects and accepted candidates, and a button to view more details about each referral.
// The data is fetched from the backend API with the applied filters and pagination, and loading states are shown while the data is being fetched.
const HrReferrals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hrReferrals, setHrReferrals] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 9;
  const [positions, setPositions] = useState([]);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL params on mount
  const initialPositionId = searchParams.get("positionId") || "";
  const initialSearch = searchParams.get("search") || "";

  const [filters, setFilters] = useState({
    search: initialSearch,
    status: "",
    createdAt: "",
    positionId: initialPositionId,
    onlyInProgress: false,
  });

  // Initialize positionId and searchInput from URL params
  const [positionId, setPositionId] = useState(initialPositionId);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [onlyInProgress, setOnlyInProgress] = useState(false);

  // Read positionId and search from URL params and apply filters automatically
  useEffect(() => {
    const urlPositionId = searchParams.get("positionId");
    const urlSearch = searchParams.get("search");

    // Reset page when URL params change
    setPage(1);

    // Update search input and filter
    const newSearch = urlSearch || "";
    setSearchInput(newSearch);
    setFilters((prev) => ({ ...prev, search: newSearch }));

    // Update positionId and filter
    const newPositionId = urlPositionId || "";
    setPositionId(newPositionId);
    setFilters((prev) => ({ ...prev, positionId: newPositionId }));
  }, [searchParams]);

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
          const hasNextPage = data?.totalPages && currentPage < data.totalPages;
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
          onlyInProgress: filters.onlyInProgress,
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
      onlyInProgress,
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
      return {
        text: "Accepted in Other Position",
        className: "status-badge-accepted-other",
      };
    }

    // If status is Hired or candidate is accepted, show Accepted
    if (status === "Hired" || candidateAcceptance) {
      return { text: "Accepted", className: "status-badge-accepted" };
    }

    // If Prospect is true, show Prospect badge
    if (prospect) {
      return { text: "Prospect", className: "status-badge-prospect" };
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
                label: `${pos.PositionTitle} - ${pos.CompanyName}`,
              })),
            ]}
            value={positionId}
            onChange={(value) => setPositionId(value)}
            placeholder="All Positions"
            searchPlaceholder="Search positions..."
            noResultsText="No positions found"
            loading={loading}
          />

          <NormalSelect
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "All Status" },
              { value: "Confirmed", label: "Confirmed" },
              { value: "InterviewOne", label: "Interview One" },
              { value: "InterviewTwo", label: "Interview Two" },
              { value: "Acceptance", label: "Acceptance" },
              { value: "Hired", label: "Hired" },
            ]}
            placeholder="All Status"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <label className="in-progress-filter">
            <input
              type="checkbox"
              checked={onlyInProgress}
              onChange={(e) => setOnlyInProgress(e.target.checked)}
            />
            <span>Only in-progress</span>
          </label>
          <button className="apply-btn" onClick={handleApplyFilters}>
            Apply
          </button>
        </div>
      </div>

      <span className="candidateStats">
        {loading
          ? ""
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
          hrReferrals.map((ref) => {
            const badge = getStatusBadge(ref);
            return (
              <div className="candidate" key={ref.Referral?.ReferralId}>
                <div className="candidate-header">
                  <div className="hr-referrals-avatar">
                    {ref.Candidate?.FirstName?.[0]}
                    {ref.Candidate?.LastName?.[0]}
                  </div>
                  <div className="candidate-info">
                    <h4 className="candidate-name">
                      {ref.Candidate?.FirstName} {ref.Candidate?.LastName}
                    </h4>
                    <div className="candidate-email">
                      <Mail size={16} />
                      <span>{ref.Candidate?.Email}</span>
                    </div>
                  </div>
                </div>

                <div className="candidate-body">
                  <div className="candidate-details">
                    <div className="detail-item">
                      <Briefcase size={16} />
                      <span className="detail-label">Position</span>
                      <span className="detail-value">
                        {ref.Position?.PositionTitle}
                      </span>
                    </div>
                    <div className="detail-item">
                      <MapPin size={16} />
                      <span className="detail-label">Location</span>
                      <span className="detail-value">
                        {ref.Position?.Timezone}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span
                        className={`statusBadge status-${ref.Referral?.Status?.toLowerCase()}`}
                      >
                        {ref.Referral?.Status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="candidate-footer">
                  <span className={`statusBadgeSecondary ${badge.className}`}>
                    {badge.text}
                  </span>
                  <Link
                    to={`/dashboard/hr/referrals/${ref.id || ref.Referral?.ReferralId}`}
                    className="referral-details-btn-style"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })
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
