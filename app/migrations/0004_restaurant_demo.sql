-- Restaurant ordering + table-booking demo (Hyd Biryani-style project). Additive only.

CREATE TABLE IF NOT EXISTS restaurant_orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  fulfillment TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  items_json TEXT NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS restaurant_bookings (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_restaurant_bookings_slot ON restaurant_bookings (booking_date, booking_time);
