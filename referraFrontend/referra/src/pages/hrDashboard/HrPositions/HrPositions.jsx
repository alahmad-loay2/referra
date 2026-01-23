import React from "react";
import "./HrPositions.css";
import { Briefcase, Users, Layers } from "lucide-react"
const HrPositions = () => {
  return (
    <div className="positionsHR">

      <div className="positionCardsContainer">
        <div className="positionCards">
          <div className="positionsIcon">
          <Briefcase size={20} color="white"/>
          </div>
          <div className="positionCardsText">
          <p>Total Positions</p>
          <span>2</span>
          </div>
        </div>
        <div className="positionCards">
          <div className="positionsIcon">
          <Users  size={20} color="white"/>
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
        <input
          type="text"
          className="searchPositionInput"
          placeholder="Search for positions"
        />
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

      <div className="positionsTableContainer">
        
      </div>

    </div>
  );
};

export default HrPositions;

