"use client";

import React from "react";
import styles from "./FilterBar.module.css";
import { Category } from "@/data/menuData";

interface FilterBarProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  sections: string[];          // sub-sections for the active category
  activeSection: string | null;
  onSectionChange: (section: string | null) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  sections,
  activeSection,
  onSectionChange,
}) => {
  return (
    <div className={styles.wrapper}>
      {/* Row 1 — top-level category tabs */}
      <div className={styles.row}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catActive : ""}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            <span className={styles.catName}>{cat.name}</span>
            <sup className={styles.catCount}>{cat.count}</sup>
          </button>
        ))}
      </div>

      {/* Row 2 — sub-section pills (only when a specific category is selected) */}
      {sections.length > 0 && activeCategory !== "all" && (
        <div className={styles.row}>
          {sections.map((sec) => (
            <button
              key={sec}
              className={`${styles.secBtn} ${activeSection === sec ? styles.secActive : ""}`}
              onClick={() => onSectionChange(activeSection === sec ? null : sec)}
            >
              {sec}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
