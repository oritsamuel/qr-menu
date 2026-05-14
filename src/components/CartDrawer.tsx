"use client";

import React from "react";
import styles from "./CartDrawer.module.css";
import { useCart } from "@/context/CartContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, totalPrice, clearCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Your Cart</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.items}>
          {cart.length === 0 ? (
            <p className={styles.empty}>Your cart is empty</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <h4 className={styles.itemName}>{item.name}</h4>
                  <p className={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className={styles.itemControls}>
                  <button 
                    className={styles.qtyBtn} 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className={styles.quantity}>{item.quantity}</span>
                  <button 
                    className={styles.qtyBtn} 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Total Price</span>
              <span className={styles.totalPrice}>${totalPrice.toFixed(2)}</span>
            </div>
            <button className={styles.checkoutBtn}>Checkout</button>
            <button className={styles.clearBtn} onClick={clearCart}>Clear Cart</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
