"use client";

import React, { useState } from "react";
import { menuData } from "@/data/menuData";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import MenuSection from "@/components/MenuSection";
import BottomNav from "@/components/BottomNav";
import CartDrawer from "@/components/CartDrawer";
import styles from "./page.module.css";

export default function MenuPage({
  params,
}: {
  params: { company: string; branch: string };
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // In a real app, we would fetch data based on params.company and params.branch
  const data = menuData;

  // Group items by section
  const sections = data.items.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof data.items>);

  return (
    <main className={styles.main}>
      <Header companyName={data.companyName} branchName={data.branchName} />
      <div className={styles.content}>
        <div className={styles.stickyHeader}>
          <FilterBar categories={data.categories} activeCategory="all" />
        </div>
        <div className={styles.sections}>
          {Object.entries(sections).map(([sectionName, items]) => (
            <MenuSection
              key={sectionName}
              title={sectionName}
              items={items}
            />
          ))}
        </div>
      </div>
      <BottomNav onCartClick={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </main>
  );
}

