import React, { useEffect, useState, useRef } from "react";
import "./HrPositions.css";
import { Briefcase, Users, Layers, Search, MoreVertical } from "lucide-react";
import Button from "../../../components/button/Button";
import {
  getDashboardStats,
  getHrPositions,
  updatePositionState,
  getHrDepartments,
} from "../../../api/hrPositions.api.js";
import Loading from "../../../components/loading/Loading.jsx";
import { useNavigate } from "react-router-dom";

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
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const [departments, setDepartments] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    departmentId: "",
  });

  const handleToggleState = async (positionId, currentState) => {
    const newState = currentState === "OPEN" ? "CLOSED" : "OPEN";

    try {
      setHrPositions((prev) =>
        prev.map((p) =>
          p.PositionId === positionId ? { ...p, PositionState: newState } : p,
        ),
      );

      await updatePositionState(positionId, newState);
    } catch (err) {
      setHrPositions((prev) =>
        prev.map((p) =>
          p.PositionId === positionId
            ? { ...p, PositionState: currentState }
            : p,
        ),
      );
      console.error("Failed to update position state");
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
        setStatsLoading(false);
      } catch (err) {
        console.error("Failed to fetch dashboard stats");
      }
    };
    fetchStats();
  }, []);

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
      try {
        setError(false);
        const data = await getHrPositions({
          page,
          limit,
          search: filters.search,
          status: filters.status,
          departmentId: filters.departmentId,
        });

        if (!data || !data.positions) {
          setHrPositions([]);
          setTotalPages(1);
          setError(true);
          return;
        }

        setHrPositions(data.positions);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error("Failed to fetch hr positions");
        setHrPositions([]);
        setTotalPages(1);
        setError(true);
      } finally {
        setPositionsLoading(false);
      }
    };

    fetchHrPositions();
  }, [page, filters]);

  const handleApplyFilters = () => {
    setPage(1);
    setFilters({
      search: searchInput,
      status,
      departmentId,
    });
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
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
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
            {statsLoading ? <Loading /> : <span>{stats.totalPositions}</span>}
          </div>
        </div>
        <div className="positionCards">
          <div className="positionsIcon">
            <Users size={20} color="white" />
          </div>
          <div className="positionCardsText">
            <p>Total Applicants</p>
            {statsLoading ? <Loading /> : <span>{stats.totalApplicants}</span>}
          </div>
        </div>
        <div className="positionCards">
          <div className="positionsIcon">
            <Layers size={20} color="white" />
          </div>
          <div className="positionCardsText">
            <p>Open Positions</p>
            {statsLoading ? <Loading /> : <span>{stats.openPositions}</span>}
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
          <select
            name="departments"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.DepartmentId} value={dept.DepartmentId}>
                {dept.DepartmentName}
              </option>
            ))}
          </select>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button className="apply-btn" onClick={handleApplyFilters}>
            Apply
          </button>
        </div>
      </div>

      <div className="positionsTableContainer">
        <div className="tableHeader">
          <h3>All Positions</h3>
          <Button text="Add New Position" to={"create-position"} />
        </div>

        <table className="positionsTable">
          <thead>
            <tr>
              <th>Position</th>
              <th>Department</th>
              <th>Location</th>
              <th>Applicants</th>
              <th>Posted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {positionsLoading ? (
              <>
                {[...Array(10)].map((_, index) => (
                  <tr key={`skeleton-${index}`} className="skeleton-row">
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-status"></div></td>
                    <td><div className="skeleton-text"></div></td>
                  </tr>
                ))}
              </>
            ) : !error ? (
              hrPositions.map((p) => (
                <tr key={p.PositionId}>
                  <td>{p.PositionTitle}</td>
                  <td>{p.Department?.DepartmentName || "-"}</td>
                  <td>{p.PositionLocation}</td>
                  <td>{p.applicantsCount}</td>
                  <td>{new Date(p.CreatedAt).toLocaleDateString()}</td>
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
                          ref={(el) => (dropdownRefs.current[p.PositionId] = el)}
                        >
                          <button onClick={() => handleEditPosition(p.PositionId)}>
                            Edit Position
                          </button>
                          <button onClick={() => handleViewDetails(p.PositionId)}>
                            View Details
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
                  colSpan={7}
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  {"No positions found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pagination">
          <button className="nav" onClick={goPrev} disabled={page === 1}>
            ← Previous
          </button>

          {getVisiblePages().map((p) => (
            <button
              key={p}
              className={p === page ? "active" : ""}
              onClick={() => goToPage(p)}
            >
              {p}
            </button>
          ))}

          <button className="nav" onClick={goNext} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default HrPositions;
