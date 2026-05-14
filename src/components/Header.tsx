import React from "react";
import styles from "./Header.module.css";

interface HeaderProps {
  companyName: string;
  branchName: string;
}

const Header: React.FC<HeaderProps> = ({ companyName, branchName }) => {
  return (
    <header className={styles.header}>
      <div className={styles.spacer}></div>
      <div className={styles.info}>
        <h1 className={styles.companyName}>THE BISTRO</h1>
      </div>
      <div className={styles.actions}>
        <button className={styles.iconBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
