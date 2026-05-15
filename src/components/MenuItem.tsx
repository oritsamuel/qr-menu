"use client";

import React from "react";
import styles from "./MenuItem.module.css";
import { MenuItem as MenuItemType } from "@/data/menuData";
import { useCart } from "@/context/CartContext";

interface MenuItemProps {
  item: MenuItemType;
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
  const { cart, updateQuantity, addItem } = useCart();

  const cartItem = cart.find((i) => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleIncrease = () => {
    if (quantity === 0) {
      addItem(item);
    } else {
      updateQuantity(item.id, quantity + 1);
    }
  };

  const handleDecrease = () => updateQuantity(item.id, quantity - 1);

  return (
    <div className={styles.card}>
      <img src={item.image} alt={item.name} className={styles.image} />

      <div className={styles.info}>
        <h3 className={styles.name}>{item.name}</h3>
        {item.description && (
          <p className={styles.description}>{item.description}</p>
        )}
        <p className={styles.price}>
          {item.price.toFixed(2)} {item.currency}
        </p>
      </div>

      <div className={styles.actions}>
        {quantity === 0 ? (
          <button className={styles.addBtn} onClick={handleIncrease}>
            Add to cart
          </button>
        ) : (
          <div className={styles.counter}>
            <button onClick={handleDecrease} className={styles.counterBtn}>−</button>
            <span className={styles.quantity}>{quantity}</span>
            <button onClick={handleIncrease} className={styles.counterBtn}>+</button>
          </div>
        )}
        <button className={styles.likeBtn} aria-label="Like">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MenuItem;
