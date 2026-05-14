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
      <div className={styles.imageContainer}>
        <img src={item.image} alt={item.name} className={styles.image} />
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.name}>{item.name}</h3>
          <span className={styles.price}>${item.price.toFixed(0)}</span>
        </div>
        <p className={styles.description}>{item.description}</p>
        <div className={styles.footer}>
          {quantity === 0 ? (
            <button className={styles.addBtn} onClick={handleIncrease}>
              ADD
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
    </div>
  );
};

export default MenuItem;



