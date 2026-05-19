"use client";

import React, { useState, useEffect } from "react";
import styles from "./ItemDetailsPage.module.css";
import { MenuItem as MenuItemType } from "@/data/menuData";
import { useCart } from "@/context/CartContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface ItemDetailsPageProps {
  item: MenuItemType;
  companyName: string;
}

const ItemDetailsPage: React.FC<ItemDetailsPageProps> = ({ item, companyName }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { cart, addItem, updateQuantity } = useCart();

  // Track special requirements input
  const [requirements, setRequirements] = useState<string>("");

  // Portion quantity size (min 1)
  const cartItem = cart.find((i) => i.id === item.id);
  const [quantity, setQuantity] = useState<number>(1);

  // Sync portion count when cart updates
  useEffect(() => {
    setQuantity(cartItem ? cartItem.quantity : 1);
  }, [cartItem]);

  // Navigate back to menu, deleting 'item' query from URL
  const handleClose = () => {
    // If there is browser history, trigger native back (restores scroll position perfectly)
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // Fallback: manually update URL to clean menu state
      const params = new URLSearchParams(searchParams.toString());
      params.delete("item");
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  // Adjust quantity
  const handleIncrease = () => setQuantity((prev) => prev + 1);
  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // Add / Sync details with Cart and close
  const handleOrderNow = () => {
    const isAlreadyInCart = cart.some((i) => i.id === item.id);
    if (!isAlreadyInCart) {
      addItem(item);
    }
    updateQuantity(item.id, quantity);
    handleClose();
  };

  const totalItemPrice = item.price * quantity;

  // Formatting currency
  const renderPrice = (priceVal: number) => {
    const isDollar = item.currency === "$" || item.currency === "USD" || item.currency.toLowerCase() === "dollar";
    return isDollar ? `$${priceVal.toFixed(2)}` : `${priceVal.toFixed(2)} ${item.currency}`;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageContainer}>
        {/* Header with Dark Gradient Overlay, centered titles matching Delmela style */}
        <header className={styles.header}>
          <button className={styles.iconBtn} onClick={handleClose} aria-label="Back to menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className={styles.headerTitleContainer}>
            <span className={styles.headerCompany}>{companyName}</span>
            <span className={styles.headerProduct}>{item.name}</span>
          </div>

          {/* Spacer to keep flex center alignment */}
          <div className={styles.headerSpacer} />
        </header>

        {/* Dynamic Full Screen Width Horizontal Image Container */}
        <div className={styles.imageContainer}>
          <img src={item.image} alt={item.name} className={styles.image} />
        </div>

        {/* Scrollable details */}
        <div className={styles.scrollArea}>
          {/* Nav Tabs Bar */}
          {/* <div className={styles.tabContainer}>
            <button className={`${styles.tabBtn} ${styles.tabActive}`}>Description</button>
            <button className={styles.tabBtn}>Review</button>
          </div> */}

          {/* Centered Food Item Name */}
          <h1 className={styles.centeredTitle}>{item.name}</h1>

          {/* Centered Description Text */}
          <p className={styles.centeredDescription}>
            {item.description || "Scrambled eggs cooked to golden perfection with fresh cream, lightly seasoned with fresh herbs, and served warm with thick golden toast."}
          </p>

          <div className={styles.divider} />

          {/* Special requirement section */}
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

        {/* Restructured Dual-Column Bottom Bar matching reference layout exactly */}
        <footer className={styles.bottomBar}>
          {/* Left Column: Unit Price & Circle Portion controls */}
          <div className={styles.bottomLeftCol}>
            <span className={styles.colPriceText}>{renderPrice(item.price)}</span>
            <div className={styles.circlePortion}>
              <button className={styles.circleQtyBtn} onClick={handleDecrease} aria-label="Decrease portions">
                −
              </button>
              <span className={styles.qtyValue}>{quantity}</span>
              <button className={styles.circleQtyBtn} onClick={handleIncrease} aria-label="Increase portions">
                +
              </button>
            </div>
          </div>

          {/* Right Column: Total Price & Large Pill Add to Cart action */}
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
