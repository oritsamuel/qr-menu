"use client";

import React, { useState, useEffect } from "react";
import styles from "./ItemDetailsPage.module.css";
import { MenuItem as MenuItemType } from "@/data/menuData";
import { useCart } from "@/context/CartContext";

interface ItemDetailsPageProps {
  item: MenuItemType;
  companyName: string;
  onClose: () => void;
}

const ItemDetailsPage: React.FC<ItemDetailsPageProps> = ({ item, companyName, onClose }) => {
  const { cart, addItem, updateQuantity } = useCart();

  const [requirements, setRequirements] = useState("");
  const cartItem = cart.find((i) => i.id === item.id);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(cartItem ? cartItem.quantity : 1);
  }, [cartItem]);

  const handleIncrease = () => setQuantity((prev) => prev + 1);
  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleOrderNow = () => {
    if (!cart.some((i) => i.id === item.id)) addItem(item);
    updateQuantity(item.id, quantity);
    onClose();
  };

  const totalItemPrice = item.price * quantity;

  const renderPrice = (val: number) => {
    const isDollar = ["$", "USD", "dollar"].includes(item.currency.toLowerCase());
    return isDollar ? val.toFixed(2) : `${val.toFixed(2)} ${item.currency}`;
  };

  return (
    // Fixed overlay — sits on top of the menu, menu stays mounted underneath
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.pageContainer} onClick={(e) => e.stopPropagation()}>

        <header className={styles.header}>
          <button className={styles.iconBtn} onClick={onClose} aria-label="Back to menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className={styles.headerTitleContainer}>
            <span className={styles.headerCompany}>{companyName}</span>
            <span className={styles.headerProduct}>{item.name}</span>
          </div>
          <div className={styles.headerSpacer} />
        </header>

        <div className={styles.imageContainer}>
          <img
            src={item.image && item.image.trim() !== "" ? item.image : "https://placehold.co/800x400"}
            alt={item.name}
            className={styles.image}
          />
        </div>

        <div className={styles.scrollArea}>
          <h1 className={styles.centeredTitle}>{item.name}</h1>
          <p className={styles.centeredDescription}>
            {item.description || "No Description"}
          </p>

          <div className={styles.divider} />

          <div className={styles.requirementsWrapper}>
            <div className={styles.requirementsHeader}>
              <span className={styles.plusIcon}>+</span> Special requirement?
            </div>
            <div className={styles.requirementsBox}>
              <span className={styles.pencilIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </span>
              <textarea
                className={styles.requirementsInput}
                placeholder="Write your special requirements..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        <footer className={styles.bottomBar}>
          <div className={styles.bottomLeftCol}>
            <span className={styles.colPriceText}>{renderPrice(item.price)}</span>
            <div className={styles.circlePortion}>
              <button className={styles.circleQtyBtn} onClick={handleDecrease}>−</button>
              <span className={styles.qtyValue}>{quantity}</span>
              <button className={styles.circleQtyBtn} onClick={handleIncrease}>+</button>
            </div>
          </div>
          <div className={styles.bottomRightCol}>
            <span className={styles.colPriceText}>{renderPrice(totalItemPrice)}</span>
            <button className={styles.addToCartBtn} onClick={handleOrderNow}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Add to cart
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default ItemDetailsPage;
