export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: string;     // top-level tab name (e.g. "food", "beverage")
  categoryCode: number; // numeric code of the super-parent category
  section: string;      // sub-section name (e.g. "Burger", "Soft Drink")
  sectionCode: number;  // numeric code of the parent category
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface MenuData {
  companyName: string;
  branchName: string;
  categories: Category[];
  items: MenuItem[];
}
