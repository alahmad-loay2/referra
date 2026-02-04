import React from "react";
import { Briefcase, Calendar, Building2 } from "lucide-react";
import { fetchVisiblePositions } from "../../../api/positions.api";
import Button from "../../../components/button/Button";

import "./EmployeePositions.css";

const PAGE_SIZE = 3;

const EmployeePositions = () => {
  const [positions, setPositions] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [totalPages, setTotalPages] = React.useState(1);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  React.useEffect(() => {
    setLoading(true);
    fetchVisiblePositions({ page, pageSize: PAGE_SIZE })
      .then((res) => {
        setPositions(res.positions || []);
        setTotalPages(res.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page]);
  const formatEmploymentType = (type) => {
    if (!type) return "";

    return type
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="positions-container">
      <div className="positions-header">
        <h1>Open positions</h1>
        <p>Browse available positions and refer qualified candidates</p>
      </div>

      {loading ? (
        <div className="positions-list">
          {[...Array(PAGE_SIZE)].map((_, i) => (
            <div key={i} className="position-card skeleton">
              <div className="left">
                <div className="avatar skeleton-box" />
                <div className="info">
                  <div className="skeleton-line title" />
                  <div className="skeleton-line meta" />
                </div>
              </div>
              <div className="skeleton-button" />
            </div>
          ))}
        </div>
      ) : (
        <div className="positions-list">
          {positions.map((pos) => (
            <div key={pos.PositionId} className="position-card">
              <div className="left">
                <div className="avatar">
                  <Briefcase size={18} />
                </div>

                <div className="info">
                  <h3>{pos.PositionTitle}</h3>

                  <div className="meta">
                    <span>
                      <Building2 size={14} />
                      {pos.Department.DepartmentName}
                    </span>
                    <span>
                      <Briefcase size={14} />
                      {formatEmploymentType(pos.EmploymentType)}
                    </span>
                    <span>
                      <Calendar size={14} />
                      {new Date(pos.Deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                text="View Details"
                to={`/dashboard/employee/open-positions/${pos.PositionId}`}
                className="details-btn"
              />
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button disabled={page === 1} onClick={() => goToPage(page - 1)}>
          ← Previous
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={page === i + 1 ? "active" : ""}
            onClick={() => goToPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={page === totalPages}
          onClick={() => goToPage(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default EmployeePositions;
