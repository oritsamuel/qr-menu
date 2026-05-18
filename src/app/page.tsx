"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MenuData } from "@/data/menuData";
import { fetchCompanyByTin, fetchMenuData, fetchTables, CompanyInfo } from "@/lib/api";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import MenuSection from "@/components/MenuSection";
import CartDrawer from "@/components/CartDrawer";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.css";

function MenuPage() {
  const searchParams = useSearchParams();
  const tin = searchParams.get("tin") ?? "";
  const branchCode = searchParams.get("bc") ?? "";
  const tableParam = searchParams.get("table") ?? "";
  // searchParams.get("it") — industryType, available for future use

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [data, setData] = useState<MenuData | null>(null);
  const [tableValid, setTableValid] = useState<boolean | null>(null); // null = checking
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { totalCount } = useCart();

  const loadAll = () => {
    if (!tin || !branchCode) return;
    setLoading(true);
    setError(null);
    setTableValid(null);

    // Step 1: fetch company info by TIN
    fetchCompanyByTin(tin, branchCode)
      .then((info) => {
        setCompanyInfo(info);
        const companyCode = String(info.companyCode);
        const resolvedBranch = String(info.branch?.code ?? branchCode);

        // Step 2: fetch menu + validate table in parallel
        return Promise.all([
          fetchMenuData(companyCode, resolvedBranch).then((menu) => {
            menu.companyName = info.brandName || info.companyName;
            menu.branchName = info.branch?.name ?? branchCode;
            setData(menu);
          }),
          tableParam
            ? fetchTables(companyCode, resolvedBranch).then(() => {
              setTableValid(true); // skip validation for now, always valid
            })
            : Promise.resolve(setTableValid(true)),
        ]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, [tin, branchCode, tableParam]);

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

  // Missing required params
  if (!tin || !branchCode) {
    return (
      <div className={styles.state}>
        <p className={styles.errorText}>Invalid QR code.</p>
        <p className={styles.hint}>
          Expected: <code>/?it=1992&tin=TIN&bc=BRANCH&table=TABLE</code>
        </p>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className={styles.state}>
        <div className={styles.spinner} />
        <p>Loading menu...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className={styles.state}>
        <p className={styles.errorText}>Failed to load menu: {error}</p>
        <button className={styles.retryBtn} onClick={loadAll}>Retry</button>
      </div>
    );
  }

  // Invalid table — skipped for now, always proceeds

  if (!data) return null;

  return (
    <main className={styles.main}>
      <Header
        companyName={data.companyName}
        branchName={data.branchName}
        logo={companyInfo?.logo}
        table={tableParam || undefined}
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
          {activeCategoryLabel && activeCategory !== "all" && (
            <h2 className={styles.categoryHeading}>{activeCategoryLabel}</h2>
          )}
          <div className={styles.sections}>
            {Object.entries(groupedSections).map(([sectionName, items]) => (
              <MenuSection key={sectionName} title={sectionName} items={items} />
            ))}
          </div>
        </div>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        table={tableParam || undefined}
        companyCode={companyInfo?.companyCode}
        branchCode={branchCode}
        industryType={Number(searchParams.get("it") ?? 1992)}
      />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className={styles.state}>
        <div className={styles.spinner} />
      </div>
    }>
      <MenuPage />
    </Suspense>
  );
}
