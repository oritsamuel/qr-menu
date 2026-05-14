import React from "react";
import styles from "./FilterBar.module.css";
import { Category } from "@/data/menuData";

interface FilterBarProps {
  categories: Category[];
  activeCategory: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ categories, activeCategory }) => {
  return (
    <div className={styles.filterBar}>
      {categories.map((category) => (
        <button
          key={category.id}
          className={`${styles.filterBtn} ${activeCategory === category.id ? styles.active : ""}`}
        >
          <span className={styles.name}>{category.name}</span>
          <span className={styles.count}>{category.count}</span>
        </button>
      ))}
    </div>
  );
};

export default FilterBar;
