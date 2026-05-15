import React from "react";
import styles from "./Header.module.css";

interface HeaderProps {
  companyName: string;
  branchName: string;
  logo?: string;
  table?: string;
  cartCount?: number;
  onCartClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  companyName,
  branchName,
  logo,
  table,
  cartCount = 0,
  onCartClick,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          {logo && (
            <img src={logo} alt={companyName} className={styles.logo} />
          )}
          <div className={styles.info}>
            <h1 className={styles.companyName}>{companyName}</h1>
            <p className={styles.branchName}>
              {branchName}
              {table && <span className={styles.table}> · {table}</span>}
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.cartBtn} onClick={onCartClick}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Cart {cartCount > 0 && <span>({cartCount})</span>}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
