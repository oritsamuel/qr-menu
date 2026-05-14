export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  section: string;
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

export const menuData: MenuData = {
  companyName: "The Bistro",
  branchName: "Main",
  categories: [
    { id: "all", name: "All", count: 42 },
    { id: "starters", name: "Starters", count: 8 },
    { id: "mains", name: "Mains", count: 12 },
    { id: "desserts", name: "Desserts", count: 6 },
    { id: "wine", name: "Wine", count: 16 },
  ],
  items: [
    {
      id: "1",
      name: "Truffle Tagliatelle",
      description: "Handmade fresh pasta, wild mushrooms, Grana Padano, and fresh shaved truffle",
      price: 26,
      currency: "$",
      image: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=400&auto=format&fit=crop",
      category: "mains",
      section: "DINNER MAINS",
    },
    {
      id: "2",
      name: "Braised Beef Cheek",
      description: "12-hour braised cheek, root vegetables, thyme and red wine sauce",
      price: 32,
      currency: "$",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop",
      category: "mains",
      section: "DINNER MAINS",
    },
    {
      id: "3",
      name: "Pan-Seared Sea Bass",
      description: "Fillet with crispy skin, butter sauce, seasonal asparagus",
      price: 29,
      currency: "$",
      image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400&auto=format&fit=crop",
      category: "mains",
      section: "DINNER MAINS",
    },
  ],
};

