"use client";

import React, { useState, useEffect } from "react";
import styles from "./FilterDrawer.module.css";

export interface FilterSettings {
  sortBy: "default" | "name-asc" | "name-desc" | "price-desc" | "price-asc";
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterSettings;
  onApply: (filters: FilterSettings) => void;
  matchingCount: number;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onApply,
  matchingCount,
}) => {
  const [sortBy, setSortBy] = useState<FilterSettings["sortBy"]>("default");

  // Sync state with parent's active filters when opening
  useEffect(() => {
    if (isOpen) {
      setSortBy(currentFilters.sortBy);
    }
  }, [isOpen, currentFilters]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({ sortBy });
    onClose();
  };

  const handleReset = () => {
    setSortBy("default");
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* Drawer box sliding from bottom */}
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Swipe sheet indicator handle */}
        <div className={styles.swipeHandle} onClick={onClose} />

        <div className={styles.header}>
          <h2 className={styles.title}>Sort Items</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close filters">
            ✕
          </button>
        </div>

        <div className={styles.scrollContent}>
          {/* SORT BY SECTION */}
          <div className={styles.section}>
            <div className={styles.pillGrid}>
              <button
                className={`${styles.pill} ${sortBy === "default" ? styles.pillActive : ""}`}
                onClick={() => setSortBy("default")}
              >
                Default
              </button>
              <button
                className={`${styles.pill} ${sortBy === "name-asc" ? styles.pillActive : ""}`}
                onClick={() => setSortBy("name-asc")}
              >
                Name: A-Z
              </button>
              <button
                className={`${styles.pill} ${sortBy === "name-desc" ? styles.pillActive : ""}`}
                onClick={() => setSortBy("name-desc")}
              >
                Name: Z-A
              </button>
              <button
                className={`${styles.pill} ${sortBy === "price-desc" ? styles.pillActive : ""}`}
                onClick={() => setSortBy("price-desc")}
              >
                Price: High to low
              </button>
              <button
                className={`${styles.pill} ${sortBy === "price-asc" ? styles.pillActive : ""}`}
                onClick={() => setSortBy("price-asc")}
              >
                Price: Low to High
              </button>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className={styles.footer}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset All
          </button>
          <button className={styles.applyBtn} onClick={handleApply}>
            Show {matchingCount} {matchingCount === 1 ? "Item" : "Items"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
