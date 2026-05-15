export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: string; // top-level tab (e.g. "canteen", "beverages")
  section: string;  // sub-section within a category (e.g. "Sandwiches", "Hot Drinks")
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
  branchName: "Main Branch",
  categories: [
    { id: "all", name: "All", count: 0 }, // count filled dynamically
    { id: "canteen", name: "Canteen", count: 0 },
    { id: "beverages", name: "Beverages", count: 0 },
    { id: "fast-food", name: "Fast Food", count: 0 },
    { id: "desserts", name: "Desserts", count: 0 },
  ],
  items: [
    // ── Canteen / Sandwiches ──────────────────────────────────────────────
    {
      id: "c1",
      name: "Potato Sandwich",
      description: "Potato, Chili, Ketchup, Onion, Chili Pepper",
      price: 69,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=400&auto=format&fit=crop",
      category: "canteen",
      section: "Sandwiches",
    },
    {
      id: "c2",
      name: "Egg Sandwich",
      description: "Fried egg, cheese, lettuce, tomato on toasted bread",
      price: 103,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1550507992-eb63ffee0847?q=80&w=400&auto=format&fit=crop",
      category: "canteen",
      section: "Sandwiches",
    },
    {
      id: "c3",
      name: "Boiled Egg With Bread",
      description: "Two boiled eggs served with fresh bread",
      price: 80,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=400&auto=format&fit=crop",
      category: "canteen",
      section: "Sandwiches",
    },
    {
      id: "c4",
      name: "Peanut Butter With Honey Sandwich",
      description: "Creamy peanut butter and natural honey on white bread",
      price: 75,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop",
      category: "canteen",
      section: "Sandwiches",
    },
    // ── Canteen / Bakery Corner ───────────────────────────────────────────
    {
      id: "c5",
      name: "Cheese On Toast",
      description: "Melted cheddar on thick-cut toasted bread",
      price: 56,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=400&auto=format&fit=crop",
      category: "canteen",
      section: "Bakery Corner",
    },
    {
      id: "c6",
      name: "Croissant",
      description: "Buttery, flaky French-style croissant",
      price: 45,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=400&auto=format&fit=crop",
      category: "canteen",
      section: "Bakery Corner",
    },
    // ── Canteen / Traditional Corner ─────────────────────────────────────
    {
      id: "c7",
      name: "Scrambled Egg",
      description: "Soft scrambled eggs with butter and herbs",
      price: 92,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?q=80&w=400&auto=format&fit=crop",
      category: "canteen",
      section: "Traditional Corner",
    },
    {
      id: "c8",
      name: "Firfir",
      description: "Injera pieces sautéed with berbere spice and butter",
      price: 85,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=400&auto=format&fit=crop",
      category: "canteen",
      section: "Traditional Corner",
    },
    // ── Beverages / Hot Drinks ────────────────────────────────────────────
    {
      id: "b1",
      name: "Espresso",
      description: "Single shot of rich, dark espresso",
      price: 35,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=400&auto=format&fit=crop",
      category: "beverages",
      section: "Hot Drinks",
    },
    {
      id: "b2",
      name: "Cappuccino",
      description: "Espresso with steamed milk foam",
      price: 55,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=400&auto=format&fit=crop",
      category: "beverages",
      section: "Hot Drinks",
    },
    {
      id: "b3",
      name: "Ethiopian Coffee",
      description: "Traditional Ethiopian coffee ceremony brew",
      price: 40,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400&auto=format&fit=crop",
      category: "beverages",
      section: "Hot Drinks",
    },
    // ── Beverages / Cold Drinks ───────────────────────────────────────────
    {
      id: "b4",
      name: "Fresh Orange Juice",
      description: "Freshly squeezed orange juice",
      price: 65,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=400&auto=format&fit=crop",
      category: "beverages",
      section: "Cold Drinks",
    },
    {
      id: "b5",
      name: "Mango Smoothie",
      description: "Blended fresh mango with milk and honey",
      price: 75,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=400&auto=format&fit=crop",
      category: "beverages",
      section: "Cold Drinks",
    },
    // ── Fast Food ─────────────────────────────────────────────────────────
    {
      id: "f1",
      name: "Beef Burger",
      description: "Grilled beef patty, lettuce, tomato, pickles, special sauce",
      price: 145,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop",
      category: "fast-food",
      section: "Burgers",
    },
    {
      id: "f2",
      name: "Chicken Burger",
      description: "Crispy fried chicken, coleslaw, mayo",
      price: 130,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=400&auto=format&fit=crop",
      category: "fast-food",
      section: "Burgers",
    },
    {
      id: "f3",
      name: "French Fries",
      description: "Crispy golden fries with seasoning",
      price: 55,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400&auto=format&fit=crop",
      category: "fast-food",
      section: "Sides",
    },
    {
      id: "f4",
      name: "Onion Rings",
      description: "Beer-battered crispy onion rings",
      price: 60,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1639024471283-03518883512d?q=80&w=400&auto=format&fit=crop",
      category: "fast-food",
      section: "Sides",
    },
    // ── Desserts ──────────────────────────────────────────────────────────
    {
      id: "d1",
      name: "Chocolate Lava Cake",
      description: "Warm chocolate cake with a molten center, served with vanilla ice cream",
      price: 95,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=400&auto=format&fit=crop",
      category: "desserts",
      section: "Cakes",
    },
    {
      id: "d2",
      name: "Cheesecake",
      description: "New York style cheesecake with berry compote",
      price: 85,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=400&auto=format&fit=crop",
      category: "desserts",
      section: "Cakes",
    },
    {
      id: "d3",
      name: "Tiramisu",
      description: "Classic Italian dessert with mascarpone and espresso",
      price: 90,
      currency: "Birr",
      image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=400&auto=format&fit=crop",
      category: "desserts",
      section: "Classics",
    },
  ],
};

// Compute counts dynamically
menuData.categories = menuData.categories.map((cat) => ({
  ...cat,
  count:
    cat.id === "all"
      ? menuData.items.length
      : menuData.items.filter((item) => item.category === cat.id).length,
}));
