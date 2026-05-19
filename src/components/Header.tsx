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
          {logo ? (
            <img src={logo} alt={companyName} className={styles.companyLogo} />
          ) : (
            <div className={styles.fallbackLogo}>
              {companyName ? companyName.charAt(0).toUpperCase() : "B"}
            </div>
          )}
          <div className={styles.info}>
            <p className={styles.branchName}>
              {branchName}
              {table && <span className={styles.table}> · {table}</span>}
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <img src="/hulubeje-logo.jpg" alt="HuluBeje" className={styles.huluLogo} />
        </div>
      </div>
    </header>
  );
};

export default Header;
