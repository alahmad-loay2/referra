import React from "react";
import { Briefcase, Calendar, Building2, Building } from "lucide-react";
import { fetchVisiblePositions } from "../../../api/positions.api";
import Button from "../../../components/button/Button";
import { getPaginationPages } from "../../../utils/pagination";

import "./EmployeePositions.css";
// Employee Positions page that displays a paginated list of open positions that employees can refer candidates for.
// Each position card shows the job title, company name, department, employment type, and deadline, along with a button to view more details.
const PAGE_SIZE = 5;

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
                <div className="avatar" />
                <div className="info">
                  <h3></h3>
                  <div className="meta">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
              <div className="details-btn" />
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
                      <Building size={14} />
                      <span className="meta-text">
                        {pos.CompanyName || "-"}
                      </span>
                    </span>
                    <span>
                      <Building2 size={14} />
                      <span className="meta-text">
                        {pos.Department.DepartmentName}
                      </span>
                    </span>
                    <span>
                      <Briefcase size={14} />
                      <span className="meta-text">
                        {formatEmploymentType(pos.EmploymentType)}
                      </span>
                    </span>
                    <span>
                      <Calendar size={14} />
                      <span className="meta-text">
                        {new Date(pos.Deadline).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
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

        {getPaginationPages(page, totalPages).map((p, i) => {
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
              className={page === p ? "active" : ""}
              onClick={() => goToPage(p)}
            >
              {p}
            </button>
          );
        })}

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
