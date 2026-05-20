"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function MenuPage() {
  const searchParams = useSearchParams();
  const tin        = searchParams.get("tin") ?? "";
  const branchCode = searchParams.get("bc") ?? "";
  const tableParam = searchParams.get("table") ?? "T18";

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterSettings>({
    sortBy: "default",
  });

  const { totalCount } = useCart();

  const loadAll = () => {
    if (!tin || !branchCode) return;
    setLoading(true);
    setError(null);

    fetchCompanyByTin(tin, branchCode)
      .then((info) => {
        setCompanyInfo(info);
        const companyCode   = String(info.companyCode);
        const resolvedBranch = String(info.branch?.code ?? branchCode);

        return fetchMenuData(companyCode, resolvedBranch).then((menu) => {
            menu.companyName = info.brandName || info.companyName;
            menu.branchName  = info.branch?.name ?? branchCode;
            setData(menu);
          });
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, [tin, branchCode, tableParam]);

  const categoryItems = useMemo(() => {
    if (!data) return [];
    let items = [...data.items];

    // 1. Filter by category
    if (activeCategory !== "all") {
      items = items.filter((item) => item.category === activeCategory);
    }

    // 2. Filter by search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    // 3. Sort by settings
    if (filters.sortBy === "price-asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === "price-desc") {
      items.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === "name-asc") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === "name-desc") {
      items.sort((a, b) => b.name.localeCompare(a.name));
    }

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

  if (loading) {
    return (
      <div className={styles.state}>
        <div className={styles.spinner} />
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.state}>
        <p className={styles.errorText}>Failed to load menu: {error}</p>
        <button className={styles.retryBtn} onClick={loadAll}>Retry</button>
      </div>
    );
  }

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

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        table={tableParam || undefined}
        companyCode={companyInfo?.companyCode}
        branchCode={branchCode}
        branchName={data.branchName}
        companyName={data.companyName}
        industryType={Number(searchParams.get("it") ?? 1992)}
      />

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentFilters={filters}
        onApply={setFilters}
        matchingCount={categoryItems.length}
      />

      <BottomNav onCartClick={() => setIsCartOpen(true)} />

      {/* Item detail modal — renders over the menu, no navigation */}
      {selectedItem && (
        <ItemDetailsPage
          item={selectedItem}
          companyName={data.companyName}
          onClose={() => setSelectedItem(null)}
        />
      )}
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
