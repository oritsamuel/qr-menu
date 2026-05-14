import React from "react";
import styles from "./MenuSection.module.css";
import MenuItem from "./MenuItem";
import { MenuItem as MenuItemType } from "@/data/menuData";

interface MenuSectionProps {
  title: string;
  items: MenuItemType[];
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, items }) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.items}>
        {items.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

export default MenuSection;
