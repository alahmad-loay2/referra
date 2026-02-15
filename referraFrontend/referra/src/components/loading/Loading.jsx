import React from "react";
import "./Loading.css";
// Simple loading spinner component that can be used across the app when data is being fetched or actions are being processed. It uses CSS for the spinner animation.
const Loading = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
    </div>
  );
};

export default Loading;
