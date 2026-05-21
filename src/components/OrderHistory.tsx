"use client";

import React, { useState, useEffect } from "react";
import styles from "./OrderHistory.module.css";
import { fetchVoucherHistory, fetchVoucherDetail, VoucherHistory, VoucherDetail } from "@/lib/api";

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ isOpen, onClose, phone }) => {
  const [history, setHistory]       = useState<VoucherHistory[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [selected, setSelected]     = useState<VoucherHistory | null>(null);
  const [detail, setDetail]         = useState<VoucherDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]     = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !phone) return;
    setLoading(true); setError(null);
    fetchVoucherHistory(phone)
      .then(setHistory)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load history"))
      .finally(() => setLoading(false));
  }, [isOpen, phone]);

  // Reset detail when drawer closes
  useEffect(() => {
    if (!isOpen) { setSelected(null); setDetail(null); }
  }, [isOpen]);

  const handleCardClick = (item: VoucherHistory) => {
    setSelected(item);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    fetchVoucherDetail(item.voucherCode, item.companyCode, item.industryType)
      .then(setDetail)
      .catch((err: unknown) => setDetailError(err instanceof Error ? err.message : "Failed to load detail"))
      .finally(() => setDetailLoading(false));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          {selected ? (
            <button className={styles.backBtn} onClick={() => setSelected(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          ) : <div style={{ width: 28 }} />}
          <h2 className={styles.title}>{selected ? "Order Detail" : "Order History"}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* ── LIST VIEW ── */}
        {!selected && (
          <>
            {loading && (
              <div className={styles.center}>
                <div className={styles.spinner} />
                <p>Loading...</p>
              </div>
            )}
            {error && <p className={styles.error}>{error}</p>}
            {!loading && !error && history.length === 0 && (
              <p className={styles.hint}>No orders found.</p>
            )}
            <div className={styles.list}>
              {history.map((item) => (
                <button key={item.voucherCode} className={styles.card} onClick={() => handleCardClick(item)}>
                  <img src={item.logo || "https://placehold.co/56x56"} alt={item.companyName} className={styles.logo} />
                  <div className={styles.info}>
                    <p className={styles.companyName}>{item.companyName}</p>
                    <p className={styles.detail}>{item.branchName}</p>
                    <p className={styles.detail}>{item.voucherCode}</p>
                    <p className={styles.detail}>{formatDate(item.issuedDate)}</p>
                    <p className={styles.amount}>{item.grandTotal.toFixed(2)} ETB</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── DETAIL VIEW ── */}
        {selected && (
          <div className={styles.detailScroll}>
            {detailLoading && (
              <div className={styles.center}>
                <div className={styles.spinner} />
                <p>Loading...</p>
              </div>
            )}
            {detailError && <p className={styles.error}>{detailError}</p>}
            {detail && (
              <>
                {/* Header info box */}
                <div className={styles.receiptHeader}>
                  <p className={styles.receiptDate} style={{ textAlign: "right" }}>
                    Date: {formatDate(detail.issuedDate)}
                  </p>
                  <p className={styles.receiptRow}><span>Company:</span> {selected.companyName}</p>
                  <p className={styles.receiptRow}><span>Branch Name:</span> {selected.branchName}</p>
                  <p className={styles.receiptRow}><span>Company TIN:</span> {selected.tin}</p>
                  <p className={styles.receiptRow}><span>Ecom Ref:</span> {detail.voucherCode}</p>
                </div>

                {/* Line items table */}
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.thDesc}>Description</th>
                      <th className={styles.thNum}>Qty</th>
                      <th className={styles.thNum}>Price</th>
                      <th className={styles.thNum}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lineItems.map((li) => (
                      <tr key={li.lineItemId ?? li.article}>
                        <td className={styles.tdDesc}>{li.name.toUpperCase()}</td>
                        <td className={styles.tdNum}>{li.quantity}</td>
                        <td className={styles.tdNum}>{li.unitAmount.toFixed(2)}</td>
                        <td className={styles.tdNum}>{(li.unitAmount * li.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Extra charges */}
                <div className={styles.charges}>
                  {Object.entries(detail.extraCharge).map(([label, val]) => (
                    <div key={label} className={styles.chargeRow}>
                      <span>{label}</span>
                      <span>{Number(val).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <span>{detail.grandTotal.toFixed(2)}</span>
                </div>

                {/* Extra information */}
                {Object.keys(detail.extraInformation).length > 0 && (
                  <div className={styles.extraInfo}>
                    <div className={styles.extraInfoIcon}>ℹ</div>
                    <div className={styles.extraInfoRows}>
                      {Object.entries(detail.extraInformation).map(([key, val]) => (
                        <div key={key} className={styles.extraInfoRow}>
                          <span>{key}</span>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default OrderHistory;
