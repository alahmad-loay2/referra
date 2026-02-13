import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import "./SearchableSelect.css";

const SearchableSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  noResultsText = "No results found",
  disabled = false,
  loading = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
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
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredOptions, highlightedIndex]);

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
    if (disabled || loading) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-select ${className} ${isOpen ? "open" : ""} ${
        disabled ? "disabled" : ""
      }`}
    >
      <div className="searchable-select-trigger" onClick={handleToggle}>
        {displayValue ? (
          <span className="searchable-select-value">{displayValue}</span>
        ) : (
          <span className="searchable-select-placeholder">{placeholder}</span>
        )}
        <div className="searchable-select-actions">
          {value && !disabled && (
            <button
              type="button"
              className="searchable-select-clear"
              onClick={handleClear}
              onMouseDown={(e) => e.preventDefault()}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={18}
            className={`searchable-select-chevron ${isOpen ? "open" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown" ref={dropdownRef}>
          <div className="searchable-select-search">
            <Search size={16} className="searchable-select-search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="searchable-select-input"
            />
          </div>

          <div className="searchable-select-options">
            {loading ? (
              <div className="searchable-select-loading">Loading...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="searchable-select-no-results">
                {noResultsText}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={`searchable-select-option ${
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
    </div>
  );
};

export default SearchableSelect;
