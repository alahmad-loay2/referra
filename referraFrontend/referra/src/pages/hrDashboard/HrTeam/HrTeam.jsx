import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Users,
  Search,
  Phone,
  Calendar,
  Building2,
  Mail,
} from "lucide-react";
import Loading from "../../../components/loading/Loading.jsx";
import Button from "../../../components/button/Button.jsx";
import { getHrTeam } from "../../../api/hrTeam.api";
import { getHrDepartments } from "../../../api/hrPositions.api.js";
import { getPaginationPages } from "../../../utils/pagination";

import AddHr from "./AddHr";
import "./HrTeam.css";

const HrTeam = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    departmentsCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [hrMembers, setHrMembers] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [searchInput, setSearchInput] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    page: 1,
  });

  const [departments, setDepartments] = useState([]);

  const [showAddHr, setShowAddHr] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getHrDepartments();
        setDepartments(data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchTeam = async () => {
      setTableLoading(true);
      setStatsLoading(true);
      try {
        const data = await getHrTeam({
          search: filters.search,
          departmentId: filters.departmentId,
          page,
          limit,
        });

        setHrMembers(data.hrMembers);
        setTotalPages(data.totalPages || 1);

        // Set stats from the merged response
        if (data.stats) {
          setStats({
            totalMembers: data.stats.totalMembers,
            departmentsCount: data.stats.totalDepartments,
          });
        }
      } catch (err) {
        console.error("Failed to fetch HR team", err);
        setHrMembers([]);
      } finally {
        setTableLoading(false);
        setStatsLoading(false);
      }
    };

    fetchTeam();
  }, [filters, page]);

  const handleApplyFilters = () => {
    setPage(1);
    setFilters({
      search: searchInput,
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
    return getPaginationPages(page, totalPages);
  };

  // this is a helper componenet to show first 2 departmetns when the departments of the hr exceeds 3 it shows ...
  const DepartmentsCell = ({ departments }) => {
    const [expanded, setExpanded] = useState(false);

    if (!departments || departments.length === 0) {
      return "—";
    }

    const names = departments.map((d) => d.DepartmentName);

    const visible = expanded ? names : names.slice(0, 2);
    const hasMore = names.length > 2;

    return (
      <div className="dept-cell">
        <span>{visible.join(", ")}</span>

        {hasMore && (
          <button
            type="button"
            className="dept-toggle"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "less" : "..."}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="HRteam">
      {/* PAGE HEADER */}
      <div className="pageHeader">
        <h1 className="pageTitle">HR Team</h1>
      </div>

      {/* =======================
          CARDS
      ======================== */}
      <div className="cardsContainer">
        <div className="HRCards">
          <div className="CardsIcon">
            <Briefcase size={20} color="white" />
          </div>
          <div className="HRCardsText">
            <p>Departments Covered</p>
            <strong>
              {statsLoading ? <Loading /> : stats.departmentsCount}
            </strong>
          </div>
        </div>

        <div className="HRCards">
          <div className="CardsIcon">
            <Users size={20} color="white" />
          </div>
          <div className="HRCardsText">
            <p>Total Members</p>
            <strong>{statsLoading ? <Loading /> : stats.totalMembers}</strong>
          </div>
        </div>
      </div>

      {/* =======================
          SEARCH & FILTERS
      ======================== */}
      <div className="HRSearchContainer">
        <div className="searchInputWrapper">
          <input
            type="text"
            className="searchHRInput"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search className="searchIcon" size={16} />
        </div>

        <div className="selectContainer">
          <select
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

          <button className="apply-btn" onClick={handleApplyFilters}>
            Apply
          </button>
        </div>
      </div>

      {/* =======================
          TABLE
      ======================== */}
      <div className="HRTableContainer">
        <div className="tableHeader">
          <h3 className="title">Team Members</h3>
          <Button
            text="+ Add New HR"
            onClick={() => setShowAddHr(true)}
            variant="primary"
          />
        </div>

        <div className="HRTableWrapper">
          <table className="HRTable">
            <thead>
              <tr>
                <th>Member</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Posted</th>
              </tr>
            </thead>

            <tbody>
              {tableLoading ? (
                <>
                  {[...Array(6)].map((_, index) => (
                    <tr key={`skeleton-${index}`} className="skeleton-row">
                      <td>
                        <div className="member-cell">
                          <div className="skeleton-avatar" />
                          <div className="member-info">
                            <div className="skeleton-text short" />
                            <div className="skeleton-text tiny" />
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="skeleton-text" />
                      </td>

                      <td>
                        <div className="skeleton-text" />
                      </td>

                      <td>
                        <div className="skeleton-text" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : hrMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 20 }}>
                    No HR members found
                  </td>
                </tr>
              ) : (
                hrMembers.map((hr) => (
                  <tr key={hr.HrId}>
                    {/* MEMBER */}
                    <td>
                      <div className="member-cell">
                        <div className="avatar">
                          {hr.User.ProfileUrl ? (
                            <img
                              src={hr.User.ProfileUrl}
                              alt={`${hr.User.FirstName} ${hr.User.LastName}`}
                              className="avatar-img"
                            />
                          ) : (
                            <span>
                              {hr.User.FirstName[0]}
                              {hr.User.LastName[0]}
                            </span>
                          )}
                        </div>

                        <div className="member-info">
                          <strong>
                            {hr.User.FirstName} {hr.User.LastName}
                          </strong>
                          <div className="icon-text">
                            <Mail size={14} />
                            <span>{hr.User.Email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* DEPARTMENT */}
                    <td>
                      <div className="icon-text">
                        <Building2 size={14} />
                        <DepartmentsCell departments={hr.departments} />
                      </div>
                    </td>

                    {/* PHONE */}
                    <td>
                      <div className="icon-text">
                        <Phone size={14} />
                        {hr.User.PhoneNumber || "—"}
                      </div>
                    </td>

                    {/* DATE */}
                    <td>
                      <div className="icon-text">
                        <Calendar size={14} />
                        {new Date(hr.User.CreatedAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))
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

      {showAddHr && (
        <AddHr
          onClose={() => setShowAddHr(false)}
          onSuccess={() => {
            setShowAddHr(false);
            setFilters((prev) => ({ ...prev })); // refresh table only
          }}
        />
      )}
    </div>
  );
};

export default HrTeam;
