"use client";

import React from "react";
import styles from "./BottomNav.module.css";
import { useCart } from "@/context/CartContext";

interface BottomNavProps {
  onCartClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onCartClick }) => {
  const { totalCount } = useCart();

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <button className={`${styles.item} ${styles.active}`}>
          <span className={styles.icon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          <span className={styles.label}>Menu</span>
        </button>
        <button className={styles.item} onClick={onCartClick}>
          <span className={styles.icon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </span>
          <span className={styles.label}>Cart ({totalCount})</span>
        </button>
        <button className={styles.item}>
          <span className={styles.icon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span className={styles.label}>Service</span>
        </button>
      </nav>
    </div>
  );
};

export default BottomNav;

