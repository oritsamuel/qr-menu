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
    <div className={styles.container} onClick={onCartClick}>
      <button className={styles.cartBar} aria-label="Open Cart">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span className={styles.ctaLabel}>
          View Cart {totalCount > 0 && `(${totalCount})`}
        </span>
      </button>
    </div>
  );
};

export default BottomNav;
