"use client";

import React, { useState, useMemo, use, useEffect } from "react";
import { MenuData, MenuItem } from "@/data/menuData";
import { fetchCompanyByTin, fetchMenuData, CompanyInfo } from "@/lib/api";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import MenuSection from "@/components/MenuSection";
import CartDrawer from "@/components/CartDrawer";
import BottomNav from "@/components/BottomNav";
import ItemDetailsPage from "@/components/ItemDetailsPage";
import SearchBar from "@/components/SearchBar";
import FilterDrawer, { FilterSettings } from "@/components/FilterDrawer";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.css";

function MenuPageInner({
  params,
}: {
  params: Promise<{ company: string; branch: string }>;
}) {
  const { company: tin, branch: branchCode } = use(params);

  const [isCartOpen, setIsCartOpen]         = useState(false);
  const [selectedItem, setSelectedItem]     = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSection, setActiveSection]   = useState<string | null>(null);
  const [companyInfo, setCompanyInfo]       = useState<CompanyInfo | null>(null);
  const [data, setData]                     = useState<MenuData | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [searchQuery, setSearchQuery]       = useState("");
  const [isFilterOpen, setIsFilterOpen]     = useState(false);
  const [filters, setFilters]               = useState<FilterSettings>({ sortBy: "default" });

  const { totalCount } = useCart();

  const loadAll = () => {
    setLoading(true);
    setError(null);
    fetchCompanyByTin(tin, branchCode)
      .then((info) => {
        setCompanyInfo(info);
        return fetchMenuData(String(info.companyCode), branchCode).then((menu) => {
          menu.companyName = info.brandName || info.companyName;
          menu.branchName  = info.branch?.name ?? branchCode;
          setData(menu);
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [tin, branchCode]);

  const categoryItems = useMemo(() => {
    if (!data) return [];
    let items = [...data.items];

    if (activeCategory !== "all") {
      items = items.filter((item) => item.category === activeCategory);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    if (filters.sortBy === "price-asc")       items.sort((a, b) => a.price - b.price);
    else if (filters.sortBy === "price-desc") items.sort((a, b) => b.price - a.price);
    else if (filters.sortBy === "name-asc")   items.sort((a, b) => a.name.localeCompare(b.name));
    else if (filters.sortBy === "name-desc")  items.sort((a, b) => b.name.localeCompare(a.name));

    return items;
  }, [activeCategory, data, searchQuery, filters]);

  const sections = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of categoryItems) {
      if (!seen.has(item.section)) { seen.add(item.section); result.push(item.section); }
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
        <button className={styles.retryBtn} onClick={loadAll}>Retry</button>
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
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onFilterClick={() => setIsFilterOpen(true)}
          />
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
              <MenuSection
                key={sectionName}
                title={sectionName}
                items={items}
                onItemClick={(item) => setSelectedItem(item)}
              />
            ))}
          </div>
        </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentFilters={filters}
        onApply={setFilters}
        matchingCount={categoryItems.length}
      />

      <BottomNav onCartClick={() => setIsCartOpen(true)} />

      {selectedItem && (
        <ItemDetailsPage
          item={selectedItem}
          companyName={data.companyName}
          companyCode={companyInfo ? String(companyInfo.companyCode) : undefined}
          branchCode={companyInfo?.branch ? String(companyInfo.branch.code) : branchCode}
          onClose={() => setSelectedItem(null)}
        />
      )}
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
