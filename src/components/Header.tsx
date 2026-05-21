import React from "react";
import styles from "./Header.module.css";

interface HeaderProps {
  companyName: string;
  branchName: string;
  logo?: string;
  table?: string;
  cartCount?: number;
  onCartClick?: () => void;
  onHistoryClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  companyName,
  logo,
  cartCount = 0,
  onCartClick,
  onHistoryClick,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          {logo ? (
            <img src={logo} alt={companyName} className={styles.companyLogo} />
          ) : (
            <div className={styles.fallbackLogo}>
              {companyName ? companyName.charAt(0).toUpperCase() : "B"}
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <img src="/hulubeje-logo.jpg" alt="HuluBeje" className={styles.huluLogo} />
          {onHistoryClick && (
            <button className={styles.historyBtn} onClick={onHistoryClick} aria-label="Order history">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4l3 3" />
                <path d="M3.05 11a9 9 0 1 0 .5-4" />
                <polyline points="3 3 3 7 7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
