"use client";

import React, { useState, useMemo, use, useEffect } from "react";
import { MenuData } from "@/data/menuData";
import { fetchCompanyByTin, fetchMenuData, CompanyInfo } from "@/lib/api";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import MenuSection from "@/components/MenuSection";
import CartDrawer from "@/components/CartDrawer";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.css";

// URL params: [company] = TIN, [branch] = branchCode
function MenuPageInner({
  params,
}: {
  params: Promise<{ company: string; branch: string }>;
}) {
  const { company: tin, branch: branchCode } = use(params);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { totalCount } = useCart();

  const loadAll = () => {
    setLoading(true);
    setError(null);

    // Step 1: fetch company info by TIN
    fetchCompanyByTin(tin, branchCode)
      .then((info) => {
        setCompanyInfo(info);
        // Step 2: fetch products using the real companyCode + branchCode
        return fetchMenuData(String(info.companyCode), branchCode).then((menu) => {
          menu.companyName = info.brandName || info.companyName;
          menu.branchName = info.branch?.name ?? branchCode;
          setData(menu);
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, [tin, branchCode]);

  const categoryItems = useMemo(() => {
    if (!data) return [];
    if (activeCategory === "all") return data.items;
    return data.items.filter((item) => item.category === activeCategory);
  }, [activeCategory, data]);

  const sections = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of categoryItems) {
      if (!seen.has(item.section)) {
        seen.add(item.section);
        result.push(item.section);
      }
    }
    return result;
  }, [categoryItems]);

  const visibleItems = useMemo(() => {
    if (!activeSection) return categoryItems;
    return categoryItems.filter((item) => item.section === activeSection);
  }, [categoryItems, activeSection]);

  const groupedSections = useMemo(() => {
    const map: Record<string, typeof categoryItems> = {};
    for (const item of visibleItems) {
      if (!map[item.section]) map[item.section] = [];
      map[item.section].push(item);
    }
    return map;
  }, [visibleItems]);

  const activeCategoryLabel =
    data?.categories.find((c) => c.id === activeCategory)?.name ?? "";

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    setActiveSection(null);
  };

  if (loading) {
    return (
      <div className={styles.state}>
        <div className={styles.spinner} />
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.state}>
        <p className={styles.errorText}>Failed to load menu: {error}</p>
        <button className={styles.retryBtn} onClick={loadAll}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      <Header
        companyName={data.companyName}
        branchName={data.branchName}
        logo={companyInfo?.logo}
        cartCount={totalCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      <div className={styles.content}>
        <div className={styles.stickyHeader}>
          <FilterBar
            categories={data.categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            sections={sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <div className={styles.divider} />
        </div>

        <div className={styles.inner}>
          <h2 className={styles.categoryHeading}>{activeCategoryLabel}</h2>
          <div className={styles.sections}>
            {Object.entries(groupedSections).map(([sectionName, items]) => (
              <MenuSection key={sectionName} title={sectionName} items={items} />
            ))}
          </div>
        </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </main>
  );
}

export default function MenuPage({
  params,
}: {
  params: Promise<{ company: string; branch: string }>;
}) {
  return <MenuPageInner params={params} />;
}
