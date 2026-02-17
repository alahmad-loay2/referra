import React, { useEffect, useState, useRef } from "react";
import "./HrPositions.css";
import {
  Briefcase,
  Users,
  Layers,
  Search,
  MoreVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Button from "../../../components/button/Button";
import {
  getHrPositions,
  updatePositionState,
  getHrDepartments,
  deletePosition,
} from "../../../api/hrPositions.api.js";
import Loading from "../../../components/loading/Loading.jsx";
import { useNavigate } from "react-router-dom";
import { getPaginationPages } from "../../../utils/pagination";
import NormalSelect from "../../../components/normalSelect/NormalSelect";
// Hr Positions page that allows HR users to view and manage job positions.
const HrPositions = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPositions: 0,
    openPositions: 0,
    totalApplicants: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [hrPositions, setHrPositions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const [departments, setDepartments] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "OPEN",
    departmentId: "",
  });
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const handleToggleState = (positionId, currentState) => {
    const newState = currentState === "OPEN" ? "CLOSED" : "OPEN";
    setPendingAction({ positionId, currentState, newState });
    setShowConfirmModal(true);
  };

  const confirmToggleState = async () => {
    if (!pendingAction) return;

    // Close modal immediately for a snappier UX
    const action = pendingAction;
    setShowConfirmModal(false);
    setPendingAction(null);

    const { positionId, currentState, newState } = action;

    try {
      // Optimistic UI update
      setHrPositions((prev) =>
        prev.map((p) =>
          p.PositionId === positionId ? { ...p, PositionState: newState } : p,
        ),
      );

      await updatePositionState(positionId, newState);
    } catch (err) {
      // Revert on error
      setHrPositions((prev) =>
        prev.map((p) =>
          p.PositionId === positionId
            ? { ...p, PositionState: currentState }
            : p,
        ),
      );
      alert(err.message || "Failed to update position state");
    }
  };

  const cancelToggleState = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const depts = await getHrDepartments();
        setDepartments(depts);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchHrPositions = async () => {
      setPositionsLoading(true);
      setStatsLoading(true);
      try {
        setError(false);
        const data = await getHrPositions({
          page,
          limit,
          search: filters.search,
          status: filters.status,
          departmentId: filters.departmentId,
          // Only send sortBy/sortOrder if they're set (not empty)
          sortBy: sortBy && sortBy !== "Applicants" ? sortBy : "",
          sortOrder: sortBy && sortBy !== "Applicants" ? sortOrder : "",
        });

        if (!data || !data.positions) {
          setHrPositions([]);
          setTotalPages(1);
          setError(true);
          return;
        }

        let positions = data.positions || [];

        // Client-side sort for applicants count
        if (sortBy === "Applicants") {
          positions = [...positions].sort((a, b) => {
            const aCount = a.applicantsCount || 0;
            const bCount = b.applicantsCount || 0;
            return sortOrder === "asc" ? aCount - bCount : bCount - aCount;
          });
        }

        setHrPositions(positions);
        setTotalPages(data.totalPages);

        // Set stats from the merged response
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch hr positions");
        setHrPositions([]);
        setTotalPages(1);
        setError(true);
      } finally {
        setPositionsLoading(false);
        setStatsLoading(false);
      }
    };

    fetchHrPositions();
  }, [page, filters, sortBy, sortOrder]);

  const handleApplyFilters = () => {
    setPage(1);
    setFilters({
      search: searchInput,
      status,
      departmentId,
    });
  };

  const handleSort = (column) => {
    // Map column names to sortBy values
    const columnMap = {
      Position: "PositionTitle",
      Company: "CompanyName",
      Department: "DepartmentId",
      Location: "PositionLocation",
      Deadline: "Deadline",
      Applicants: "Applicants",
    };

    const newSortBy = columnMap[column] || column;

    // Three-state cycle: desc -> asc -> default (no sort)
    if (sortBy === newSortBy) {
      if (sortOrder === "desc") {
        // Second click: change to asc
        setSortOrder("asc");
      } else if (sortOrder === "asc") {
        // Third click: reset to default (no sort)
        setSortBy("");
        setSortOrder("");
      }
    } else {
      // First click on new column: default to desc
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = (column) => {
    const columnMap = {
      Position: "PositionTitle",
      Company: "CompanyName",
      Department: "DepartmentId",
      Location: "PositionLocation",
      Deadline: "Deadline",
      Applicants: "Applicants",
    };

    const currentSortBy = columnMap[column] || column;

    // No icon if not the active sort column or if sorting is reset
    if (sortBy !== currentSortBy || !sortBy) {
      return null;
    }

    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="sort-icon" />
    ) : (
      <ArrowDown size={14} className="sort-icon" />
    );
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

  const toggleDropdown = (positionId) => {
    setOpenDropdown(openDropdown === positionId ? null : positionId);
  };

  const handleEditPosition = (positionId) => {
    setOpenDropdown(null);
    navigate(`/dashboard/hr/positions/edit/${positionId}`);
  };

  const handleViewDetails = (positionId) => {
    setOpenDropdown(null);
    navigate(`/dashboard/hr/referrals?positionId=${positionId}`);
  };

  const handleDeletePosition = (position) => {
    setOpenDropdown(null);
    setPendingDelete(position);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const confirmDeletePosition = async () => {
    if (!pendingDelete) return;

    // Check if the typed name matches the position title
    if (deleteConfirmText.trim() !== pendingDelete.PositionTitle) {
      alert(
        "Position name does not match. Please type the exact position name.",
      );
      return;
    }

    const positionToDelete = pendingDelete;
    setShowDeleteModal(false);
    setPendingDelete(null);
    setDeleteConfirmText("");

    try {
      await deletePosition(positionToDelete.PositionId);

      // Remove the position from the list
      setHrPositions((prev) =>
        prev.filter((p) => p.PositionId !== positionToDelete.PositionId),
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalPositions: Math.max(0, prev.totalPositions - 1),
        openPositions:
          positionToDelete.PositionState === "OPEN"
            ? Math.max(0, prev.openPositions - 1)
            : prev.openPositions,
      }));
    } catch (err) {
      alert(err.message || "Failed to delete position");
    }
  };

  const cancelDeletePosition = () => {
    setShowDeleteModal(false);
    setPendingDelete(null);
    setDeleteConfirmText("");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openDropdown &&
        dropdownRefs.current[openDropdown] &&
        !dropdownRefs.current[openDropdown].contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  return (
    <div className="positionsHR">
      <div className="positionCardsContainer">
        <div className="positionCards">
          <div className="positionsIcon">
            <Briefcase size={20} color="white" />
          </div>
          <div className="positionCardsText">
            <p>Total Positions</p>
            {statsLoading ? (
              <Loading />
            ) : (
              <>
                <span>{stats.totalPositions}</span>
                <span className="positionsStatSubtitle">in your department</span>
              </>
            )}
          </div>
        </div>
        <div className="positionCards">
          <div className="positionsIcon">
            <Users size={20} color="white" />
          </div>
          <div className="positionCardsText">
            <p>Total Applicants</p>
            {statsLoading ? (
              <Loading />
            ) : (
              <>
                <span>{stats.totalApplicants}</span>
                <span className="positionsStatSubtitle">in your department</span>
              </>
            )}
          </div>
        </div>
        <div className="positionCards">
          <div className="positionsIcon">
            <Layers size={20} color="white" />
          </div>
          <div className="positionCardsText">
            <p>Open Positions</p>
            {statsLoading ? (
              <Loading />
            ) : (
              <>
                <span>{stats.openPositions}</span>
                <span className="positionsStatSubtitle">in your department</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="positionsSearchContainer">
        <div className="searchInputWrapper">
          <input
            type="text"
            className="searchPositionInput"
            placeholder="Search for positions"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search className="searchIcon" size={16} />
        </div>
        <div className="selectContainer">
          <NormalSelect
            name="departments"
            value={departmentId}
            onChange={setDepartmentId}
            options={[
              { value: "", label: "All Departments" },
              ...departments.map((dept) => ({
                value: dept.DepartmentId,
                label: dept.DepartmentName,
              })),
            ]}
            placeholder="All Departments"
          />
          <NormalSelect
            name="status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "All Status" },
              { value: "OPEN", label: "Open" },
              { value: "CLOSED", label: "Closed" },
            ]}
            placeholder="All Status"
          />
          <button className="apply-btn" onClick={handleApplyFilters}>
            Apply
          </button>
        </div>
      </div>

      <div className="positionsTableContainer">
        <div className="tableHeader">
          <h3>All Positions</h3>
          <Button text="+ Add New Position" to={"create-position"} />
        </div>

        <div className="positionsTableWrapper">
          <table className="positionsTable">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("Position")}>
                  Position {getSortIcon("Position")}
                </th>
                <th className="sortable" onClick={() => handleSort("Company")}>
                  Company {getSortIcon("Company")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("Department")}
                >
                  Department {getSortIcon("Department")}
                </th>
                <th className="sortable" onClick={() => handleSort("Location")}>
                  Location {getSortIcon("Location")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("Applicants")}
                >
                  Applicants {getSortIcon("Applicants")}
                </th>
                <th className="sortable" onClick={() => handleSort("Deadline")}>
                  Deadline {getSortIcon("Deadline")}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {positionsLoading ? (
                <>
                  {[...Array(10)].map((_, index) => (
                    <tr key={`skeleton-${index}`} className="skeleton-row">
                      <td>
                        <div className="skeleton-text"></div>
                      </td>
                      <td>
                        <div className="skeleton-text"></div>
                      </td>
                      <td>
                        <div className="skeleton-text"></div>
                      </td>
                      <td>
                        <div className="skeleton-text"></div>
                      </td>
                      <td>
                        <div className="skeleton-text"></div>
                      </td>
                      <td>
                        <div className="skeleton-text"></div>
                      </td>
                      <td>
                        <div className="skeleton-status"></div>
                      </td>
                      <td>
                        <div className="skeleton-text"></div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : !error ? (
                hrPositions.map((p) => (
                  <tr key={p.PositionId}>
                    <td>{p.PositionTitle}</td>
                    <td>{p.CompanyName || "-"}</td>
                    <td>{p.Department?.DepartmentName || "-"}</td>
                    <td>{p.PositionLocation}</td>
                    <td>{p.applicantsCount}</td>
                    <td>
                      {p.Deadline
                        ? new Date(p.Deadline).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td>
                      <div className="statusWrapper">
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={p.PositionState === "OPEN"}
                            onChange={() =>
                              handleToggleState(p.PositionId, p.PositionState)
                            }
                          />
                          <span className="slider" />
                        </label>
                        <span className="statusText">
                          {p.PositionState === "OPEN" ? "Open" : "Closed"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="actions-button"
                          onClick={() => toggleDropdown(p.PositionId)}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openDropdown === p.PositionId && (
                          <div
                            className="actions-dropdown"
                            ref={(el) =>
                              (dropdownRefs.current[p.PositionId] = el)
                            }
                          >
                            <button
                              onClick={() => handleEditPosition(p.PositionId)}
                            >
                              Edit Position
                            </button>
                            <button
                              onClick={() => handleViewDetails(p.PositionId)}
                            >
                              View Applicants
                            </button>
                            <button
                              onClick={() => handleDeletePosition(p)}
                              className="delete-action-button"
                            >
                              Delete Position
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    {"No positions found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

          <button
            className="nav"
            onClick={goNext}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingAction && (
        <div className="position-confirm-modal-overlay">
          <div className="position-confirm-modal">
            <h3>
              {pendingAction.newState === "CLOSED"
                ? "Close Position?"
                : "Open Position?"}
            </h3>
            <p>
              {pendingAction.newState === "CLOSED" ? (
                <>
                  Are you sure you want to close this position?
                  <br />
                  <br />
                  <strong>This will:</strong>
                  <br />
                  • Mark all referrals that are not hired and not accepted in
                  other positions as prospects
                  <br />• Prevent further referrals for this position
                </>
              ) : (
                <>
                  Are you sure you want to reopen this position?
                  <br />
                  <br />
                  <strong>This will:</strong>
                  <br />
                  • Unmark all prospects that were marked when the position was
                  closed
                  <br />
                  • Extend the deadline by 10 days from today
                  <br />• Allow new referrals for this position
                </>
              )}
            </p>
            <div className="position-confirm-modal-actions">
              <button
                className="position-confirm-cancel"
                onClick={cancelToggleState}
              >
                Cancel
              </button>
              <button
                className="position-confirm-submit"
                onClick={confirmToggleState}
              >
                {pendingAction.newState === "CLOSED" ? "Close" : "Open"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && pendingDelete && (
        <div className="position-confirm-modal-overlay">
          <div className="position-confirm-modal">
            <h3>Delete Position?</h3>
            <p>
              This action cannot be undone. This will permanently delete:
              <br />
              <br />
              <strong>• The position "{pendingDelete.PositionTitle}"</strong>
              <br />
              • All referrals associated with this position
              <br />
              • All applications for this position
              <br />
              • Candidates that have no other referrals
              <br />
              <br />
              To confirm, please type the position name below:
            </p>
            <div className="delete-confirm-input-wrapper">
              <input
                type="text"
                className="delete-confirm-input"
                placeholder={pendingDelete.PositionTitle}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                autoFocus
              />
            </div>
            <div className="position-confirm-modal-actions">
              <button
                className="position-confirm-cancel"
                onClick={cancelDeletePosition}
              >
                Cancel
              </button>
              <button
                className="position-confirm-submit delete-submit-button"
                onClick={confirmDeletePosition}
                disabled={
                  deleteConfirmText.trim() !== pendingDelete.PositionTitle
                }
              >
                Delete Position
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrPositions;
