// Static menu for the Hyd Biryani-style ordering demo (project: restaurant
// ordering + table booking, built by Atlas/Forge off Sketch's spec and
// Compass's tickets). Prices are in cents so order math never touches floats.
// Original names/descriptions/prices — not copied from any real restaurant.
export type MenuItem = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  veg: boolean;
  spice: 0 | 1 | 2 | 3;
};

export type MenuCategory = {
  key: string;
  name: string;
  items: MenuItem[];
};

export const MENU: MenuCategory[] = [
  {
    key: "biryani",
    name: "Biryani",
    items: [
      { id: "biryani-chicken", name: "Hyderabadi Chicken Biryani", description: "Smoky dum-cooked basmati, tender chicken, saffron.", priceCents: 1499, veg: false, spice: 2 },
      { id: "biryani-mutton", name: "Mutton Biryani", description: "Slow-cooked mutton, whole spices, mint.", priceCents: 1799, veg: false, spice: 2 },
      { id: "biryani-veg", name: "Vegetable Dum Biryani", description: "Seasonal vegetables, fried onions, cashew.", priceCents: 1199, veg: true, spice: 1 },
      { id: "biryani-egg", name: "Egg Biryani", description: "Boiled eggs, layered basmati, fried onions.", priceCents: 1099, veg: false, spice: 1 },
    ],
  },
  {
    key: "starters",
    name: "Starters",
    items: [
      { id: "chicken-65", name: "Chicken 65", description: "Crisp fried chicken, curry leaf, chili.", priceCents: 999, veg: false, spice: 3 },
      { id: "paneer-tikka", name: "Paneer Tikka", description: "Chargrilled paneer, bell pepper, tandoori masala.", priceCents: 899, veg: true, spice: 2 },
      { id: "seekh-kebab", name: "Seekh Kebab", description: "Minced lamb skewers, garam masala.", priceCents: 1099, veg: false, spice: 2 },
    ],
  },
  {
    key: "curries",
    name: "Curries",
    items: [
      { id: "butter-chicken", name: "Butter Chicken", description: "Tomato-cashew gravy, char-grilled chicken.", priceCents: 1399, veg: false, spice: 1 },
      { id: "chana-masala", name: "Chana Masala", description: "Chickpeas, tomato, ginger, cumin.", priceCents: 899, veg: true, spice: 1 },
      { id: "palak-paneer", name: "Palak Paneer", description: "Spinach gravy, paneer cubes.", priceCents: 999, veg: true, spice: 1 },
    ],
  },
  {
    key: "breads",
    name: "Breads",
    items: [
      { id: "garlic-naan", name: "Garlic Naan", description: "Tandoor-baked, garlic butter.", priceCents: 349, veg: true, spice: 0 },
      { id: "tandoori-roti", name: "Tandoori Roti", description: "Whole wheat, tandoor-baked.", priceCents: 249, veg: true, spice: 0 },
      { id: "roomali-roti", name: "Roomali Roti", description: "Thin handkerchief bread.", priceCents: 299, veg: true, spice: 0 },
    ],
  },
  {
    key: "desserts",
    name: "Desserts",
    items: [
      { id: "gulab-jamun", name: "Gulab Jamun (2 pc)", description: "Milk dumplings, rose syrup.", priceCents: 349, veg: true, spice: 0 },
      { id: "double-ka-meetha", name: "Double ka Meetha", description: "Bread pudding, saffron, nuts.", priceCents: 399, veg: true, spice: 0 },
    ],
  },
  {
    key: "beverages",
    name: "Beverages",
    items: [
      { id: "mango-lassi", name: "Mango Lassi", description: "Yogurt, mango pulp.", priceCents: 249, veg: true, spice: 0 },
      { id: "masala-chai", name: "Masala Chai", description: "Spiced milk tea.", priceCents: 149, veg: true, spice: 0 },
      { id: "soft-drink", name: "Soft Drink (can)", description: "Chilled, assorted.", priceCents: 149, veg: true, spice: 0 },
    ],
  },
];

export const MENU_BY_ID: Record<string, MenuItem> = Object.fromEntries(
  MENU.flatMap((cat) => cat.items).map((item) => [item.id, item]),
);

// Opening hours for table booking: lunch 11:30–15:00, dinner 18:00–22:30.
export function isBookableTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [h, m] = time.split(":").map(Number);
  const mins = h * 60 + m;
  const lunch = mins >= 11 * 60 + 30 && mins <= 15 * 60;
  const dinner = mins >= 18 * 60 && mins <= 22 * 60 + 30;
  return lunch || dinner;
}

// 12 tables, average 6 seats — total seated capacity per time slot.
export const TOTAL_SEATING_CAPACITY = 72;
