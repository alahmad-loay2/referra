import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import "./NormalSelect.css";
const NormalSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  name,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelect(options[highlightedIndex].value);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, options, highlightedIndex]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (isOpen) {
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div
      ref={containerRef}
      className={`normal-select ${className} ${isOpen ? "open" : ""} ${
        disabled ? "disabled" : ""
      }`}
    >
      <div className="normal-select-trigger" onClick={handleToggle}>
        {displayValue ? (
          <span className="normal-select-value">{displayValue}</span>
        ) : (
          <span className="normal-select-placeholder">{placeholder}</span>
        )}
        <div className="normal-select-actions">
          {value && !disabled && (
            <button
              type="button"
              className="normal-select-clear"
              onClick={handleClear}
              onMouseDown={(e) => e.preventDefault()}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={18}
            className={`normal-select-chevron ${isOpen ? "open" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="normal-select-dropdown" ref={dropdownRef}>
          <div className="normal-select-options">
            {options.length === 0 ? (
              <div className="normal-select-no-results">
                No options available
              </div>
            ) : (
              options.map((option, index) => (
                <div
                  key={option.value}
                  className={`normal-select-option ${
                    value === option.value ? "selected" : ""
                  } ${index === highlightedIndex ? "highlighted" : ""}`}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {name && (
        <input type="hidden" name={name} value={value} required={required} />
      )}
    </div>
  );
};

export default NormalSelect;
