"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./CartDrawer.module.css";
import { useCart } from "@/context/CartContext";
import { calculateLineItems, LineItemResult } from "@/lib/api";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  table?: string;
  companyCode?: number;
  branchCode?: string;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  table,
  companyCode,
  branchCode,
}) => {
  const { cart, updateQuantity, totalPrice, clearCart } = useCart();

  const [calcResult, setCalcResult] = useState<LineItemResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [dirty, setDirty] = useState(false); // true = cart changed since last calculation

  // Track the cart snapshot that was last calculated
  const lastCalcKey = useRef<string>("");

  const cartKey = cart.map((i) => `${i.id}:${i.quantity}`).join(",");

  // Run calculation
  const runCalculation = () => {
    if (!companyCode || !branchCode || cart.length === 0) return;

    setCalculating(true);
    setCalcResult(null);
    setDirty(false);
    lastCalcKey.current = cartKey;

    calculateLineItems(
      companyCode,
      Number(branchCode),
      cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }))
    )
      .then((result) => setCalcResult(result))
      .catch(() => setCalcResult(null))
      .finally(() => setCalculating(false));
  };

  // Auto-calculate when drawer first opens (or cart was already clean)
  useEffect(() => {
    if (!isOpen) return;
    if (cart.length === 0) { setCalcResult(null); return; }
    // Only auto-calc on open if nothing has been calculated yet
    if (lastCalcKey.current === "") {
      runCalculation();
    }
  }, [isOpen]);

  // Mark dirty whenever cart changes after initial calculation
  useEffect(() => {
    if (!isOpen) return;
    if (lastCalcKey.current === "") return; // not yet calculated, skip
    if (cartKey !== lastCalcKey.current) {
      setDirty(true);
      setCalcResult(null);
    }
  }, [cartKey]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setDirty(false);
      setCalcResult(null);
      lastCalcKey.current = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const grandTotal = calcResult?.grandTotal ?? null;
  const extraCharges = calcResult?.extraCharge ?? {};

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Your Cart</h2>
            {table && <p className={styles.tableLabel}>Table: {table}</p>}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Items */}
        <div className={styles.items}>
          {cart.length === 0 ? (
            <p className={styles.empty}>Your cart is empty</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <h4 className={styles.itemName}>{item.name}</h4>
                  <p className={styles.itemPrice}>
                    ETB {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className={styles.itemControls}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >−</button>
                  <span className={styles.quantity}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className={styles.footer}>

            {/* Extra charges from API */}
            {calcResult && Object.entries(extraCharges).map(([label, amount]) => (
              <div key={label} className={styles.chargeRow}>
                <span>{label}</span>
                <span>ETB {Number(amount).toFixed(2)}</span>
              </div>
            ))}

            {/* Total row */}
            <div className={styles.totalRow}>
              <span>Total</span>
              {calculating ? (
                <div className={styles.totalLoading}>
                  <div className={styles.totalSpinner} />
                  <span className={styles.totalCalculating}>Calculating...</span>
                </div>
              ) : dirty ? (
                <span className={styles.totalCalculating}>—</span>
              ) : (
                <span className={styles.totalPrice}>
                  ETB {grandTotal !== null ? grandTotal.toFixed(2) : totalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Primary action button */}
            {dirty ? (
              <button className={styles.updateBtn} onClick={runCalculation}>
                Update Cart
              </button>
            ) : (
              <button
                className={styles.checkoutBtn}
                disabled={calculating}
              >
                {calculating ? "Calculating..." : "Checkout"}
              </button>
            )}

            <button className={styles.clearBtn} onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
