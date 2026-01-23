import React, { useState } from "react";
import "./HrPositions.css";
import { Briefcase, Users, Layers, Search } from "lucide-react";
import Button from "../../../components/button/Button";

const HrPositions = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="positionsHR">
      <div className="positionCardsContainer">
        <div className="positionCards">
          <div className="positionsIcon">
            <Briefcase size={20} color="white" />
          </div>
          <div className="positionCardsText">
            <p>Total Positions</p>
            <span>2</span>
          </div>
        </div>
        <div className="positionCards">
          <div className="positionsIcon">
            <Users size={20} color="white" />
          </div>
          <div className="positionCardsText">
            <p>Total Positions</p>
            <span>2</span>
          </div>
        </div>
        <div className="positionCards">
          <div className="positionsIcon">
            <Layers size={20} color="white" />
          </div>
          <div className="positionCardsText">
            <p>Total Positions</p>
            <span>2</span>
          </div>
        </div>
      </div>

      <div className="positionsSearchContainer">
        <div className="searchInputWrapper">
          <input
            type="text"
            className="searchPositionInput"
            placeholder="Search for positions"
          />
          <Search className="searchIcon" size={16} />
        </div>
        <div className="selectContainer">
        <select name="departments">
          <option value="all">All Departments</option>
          <option value="hr">HR</option>
          <option value="it">IT</option>
          <option value="sales">Sales</option>
        </select>
        <select name="status">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        </div>
      </div>

      <div className="positionsTableContainer">
        <div className="tableHeader">
          <h3>All Positions</h3>
          <Button text="Add New Position" to={"create-position"}/>
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
            <tr>
              <td>Software Engineer</td>
              <td>IT</td>
              <td>New York, NY</td>
              <td>25</td>
              <td>2023-10-01</td>
              <td>
                <div className="statusWrapper">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={isOpen}
                      onChange={() => setIsOpen(!isOpen)}
                    />
                    <span className="slider" />
                  </label>
                  <span className="statusText">
                    {isOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </td>

              <td>
                <button>...</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HrPositions;
