"use client";

import React, { useState, useEffect } from "react";
import styles from "./ItemDetailsPage.module.css";
import { MenuItem as MenuItemType } from "@/data/menuData";
import { useCart } from "@/context/CartContext";
import {
  fetchModifiers,
  ItemModifier,
  MODIFIER_POINTER_ARTICLE,
  MODIFIER_POINTER_CATEGORY,
} from "@/lib/api";

interface ItemDetailsPageProps {
  item: MenuItemType;
  companyName: string;
  companyCode?: string;
  branchCode?: string;
  onClose: () => void;
}

const ItemDetailsPage: React.FC<ItemDetailsPageProps> = ({
  item, companyName, companyCode, branchCode, onClose,
}) => {
  const { cart, addItem, updateQuantity, setSpecialRequest } = useCart();

  const [requirements, setRequirements] = useState("");
  const cartItem = cart.find((i) => i.id === item.id);
  const [quantity, setQuantity] = useState(1);

  // Modifiers
  const [modifiers, setModifiers]             = useState<ItemModifier[]>([]);
  const [selectedNormals, setSelectedNormals] = useState<Set<number>>(new Set());
  const [extraQty, setExtraQty] = useState<Record<number, number>>({}); // modifier id → quantity

  useEffect(() => {
    setQuantity(cartItem ? cartItem.quantity : 1);
  }, [cartItem]);

  // Fetch modifiers for this item using the correct Flutter filter logic
  useEffect(() => {
    if (!companyCode || !branchCode) return;
    fetchModifiers(companyCode, branchCode)
      .then((all) => {
        const itemCode    = Number(item.id);
        const sectionCode = item.sectionCode;
        const catCode     = item.categoryCode;

        // 1. Common modifiers (reference == null)
        const common = all.filter((m) => m.reference === null);

        // 2. Category-level modifiers (pointer == 701, reference matches parent or super-parent)
        const categoryLevel = all.filter(
          (m) =>
            m.pointer === MODIFIER_POINTER_CATEGORY &&
            (m.reference === sectionCode || m.reference === catCode)
        );

        // 3. Article-level modifiers (pointer == 752, reference matches item code)
        const articleLevel = all.filter(
          (m) => m.pointer === MODIFIER_POINTER_ARTICLE && m.reference === itemCode
        );

        // Deduplicate by id
        const seen = new Set<number>();
        const filtered: ItemModifier[] = [];
        for (const m of [...common, ...categoryLevel, ...articleLevel]) {
          if (!seen.has(m.id)) { seen.add(m.id); filtered.push(m); }
        }

        setModifiers(filtered);
      })
      .catch(() => setModifiers([]));
  }, [item.id, item.sectionCode, item.categoryCode, companyCode, branchCode]);

  // article != null → payable extra, article == null → normal chip toggle
  const payableModifiers = modifiers.filter((m) => m.article !== null && m.name);

  // Normal modifiers grouped by reference (or by id if reference is null)
  const normalModifierGroups = modifiers
    .filter((m) => m.article === null && m.description)
    .reduce<Record<string, ItemModifier[]>>((acc, m) => {
      const key = String(m.reference ?? m.id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});

  const toggleNormal = (id: number) => {
    setSelectedNormals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const increaseExtra = (id: number) =>
    setExtraQty((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));

  const decreaseExtra = (id: number) =>
    setExtraQty((prev) => {
      const next = { ...prev };
      if ((next[id] ?? 0) <= 1) delete next[id];
      else next[id]--;
      return next;
    });

  // Sum of selected extra prices × their quantities
  const extrasTotal = payableModifiers.reduce(
    (sum, m) => sum + (m.defaultValue ?? 0) * (extraQty[m.id] ?? 0),
    0
  );

  const handleIncrease = () => setQuantity((prev) => prev + 1);
  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleOrderNow = () => {
    // Add the main item
    if (!cart.some((i) => i.id === item.id)) addItem(item);
    updateQuantity(item.id, quantity);

    // Add each selected extra as a separate cart item
    for (const mod of payableModifiers) {
      const qty = extraQty[mod.id] ?? 0;
      if (qty === 0 || !mod.article) continue;

      const extraId = String(mod.article);
      const extraItem: MenuItemType = {
        id: extraId,
        name: mod.name ?? "Extra",
        description: "",
        price: mod.defaultValue ?? 0,
        currency: item.currency,
        image: "",
        category: item.category,
        categoryCode: item.categoryCode,
        section: item.section,
        sectionCode: item.sectionCode,
      };

      if (!cart.some((i) => i.id === extraId)) addItem(extraItem);
      updateQuantity(extraId, qty);
    }

    // Save special requirement to cart context
    if (requirements.trim()) setSpecialRequest(requirements.trim());

    onClose();
  };

  const totalItemPrice = (item.price + extrasTotal) * quantity;

  const renderPrice = (val: number) => {
    const isDollar = ["$", "USD", "dollar"].includes(item.currency.toLowerCase());
    return isDollar ? val.toFixed(2) : `${val.toFixed(2)} ${item.currency}`;
  };

  return (
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

          {/* ── Payable modifiers (priced extras) ── */}
          {payableModifiers.length > 0 && (
            <>
              <div className={styles.divider} />
              <div className={styles.modifierSection}>
                <div className={styles.modifierSectionHeader}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Extra Items</span>
                </div>
                {payableModifiers.map((mod) => {
                  const qty = extraQty[mod.id] ?? 0;
                  return (
                    <div key={mod.id} className={`${styles.modifierCard} ${qty > 0 ? styles.modifierCardActive : ""}`}>
                      <div className={styles.modifierInfo}>
                        <span className={styles.modifierName}>{mod.name}</span>
                        <span className={styles.modifierPrice}>
                          {(mod.defaultValue ?? 0).toFixed(2)} {item.currency}
                        </span>
                      </div>
                      {qty === 0 ? (
                        <button className={styles.addExtraBtn} onClick={() => increaseExtra(mod.id)}>
                          + Add Extra
                        </button>
                      ) : (
                        <div className={styles.extraCounter}>
                          <button className={styles.circleQtyBtn} onClick={() => decreaseExtra(mod.id)}>−</button>
                          <span className={styles.qtyValue}>{qty}</span>
                          <button className={styles.circleQtyBtn} onClick={() => increaseExtra(mod.id)}>+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Normal modifiers (free toggles grouped by reference) ── */}
          {Object.entries(normalModifierGroups).map(([ref, group]) => (
            <div key={ref} className={styles.modifierSection}>
              <div className={styles.modifierSectionHeader}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{group[0]?.description ?? "Options"}</span>
              </div>
              <div className={styles.chipRow}>
                {group.map((mod) => (
                  <button
                    key={mod.id}
                    className={`${styles.chip} ${selectedNormals.has(mod.id) ? styles.chipActive : ""}`}
                    onClick={() => toggleNormal(mod.id)}
                  >
                    {mod.description}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className={styles.divider} />

          {/* ── Special requirements ── */}
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
