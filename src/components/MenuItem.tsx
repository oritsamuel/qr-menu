"use client";

import React from "react";
import styles from "./MenuItem.module.css";
import { MenuItem as MenuItemType } from "@/data/menuData";
import { useCart } from "@/context/CartContext";

interface MenuItemProps {
  item: MenuItemType;
  onCardClick?: (item: MenuItemType) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, onCardClick }) => {
  const { cart, updateQuantity, addItem } = useCart();

  const cartItem = cart.find((i) => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleIncrease = () => {
    if (quantity === 0) addItem(item);
    else updateQuantity(item.id, quantity + 1);
  };

  const handleDecrease = () => updateQuantity(item.id, quantity - 1);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(`.${styles.actions}`)) return;
    onCardClick?.(item);
  };

  return (
    <div className={styles.card} onClick={handleCardClick} style={{ cursor: "pointer" }}>
      {/* image with fallback for empty/missing URLs */}
      <img
        src={item.image && item.image.trim() !== "" ? item.image : "https://placehold.co/400x300"}
        alt={item.name}
        className={styles.image}
      />

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
      </div>
    </div>
  );
};

export default MenuItem;
