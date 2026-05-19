"use client";

import React, { useState, useMemo, use, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MenuData, menuData as localMenuData } from "@/data/menuData";
import { fetchCompanyByTin, fetchMenuData, CompanyInfo } from "@/lib/api";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import MenuSection from "@/components/MenuSection";
import CartDrawer from "@/components/CartDrawer";
import BottomNav from "@/components/BottomNav";
import ItemDetailsPage from "@/components/ItemDetailsPage";
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
      .catch((err) => {
        console.warn("Upstream API fetch failed. Falling back to local mock data.", err);
        setCompanyInfo({
          companyCode: 12345,
          companyName: "The Bistro",
          brandName: "The Bistro",
          logo: "",
          tin: tin,
          branch: {
            code: 54321,
            name: branchCode || "Main Branch",
            logo: null,
            latitude: null,
            longitude: null,
            phone1: null,
            specificAddress: null
          }
        });
        
        // Deep copy localMenuData to avoid mutating the original import
        const mockMenu = JSON.parse(JSON.stringify(localMenuData));
        mockMenu.companyName = "The Bistro";
        mockMenu.branchName = branchCode || "Main Branch";
        setData(mockMenu);
      })
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

  const searchParams = useSearchParams();

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

  const activeItemId = searchParams.get("item") ?? "";
  const activeItem = data.items.find((i) => i.id === activeItemId);

  return (
    <main className={styles.main}>
      {activeItem ? (
        <ItemDetailsPage item={activeItem} companyName={data.companyName} />
      ) : (
        <>
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
          <BottomNav onCartClick={() => setIsCartOpen(true)} />
        </>
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
