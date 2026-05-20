import React from "react";
import styles from "./MenuSection.module.css";
import MenuItem from "./MenuItem";
import { MenuItem as MenuItemType } from "@/data/menuData";

interface MenuSectionProps {
  title: string;
  items: MenuItemType[];
  onItemClick?: (item: MenuItemType) => void;
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, items, onItemClick }) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.items}>
        {items.map((item) => (
          <MenuItem key={item.id} item={item} onCardClick={onItemClick} />
        ))}
      </div>
    </section>
  );
};

export default MenuSection;
