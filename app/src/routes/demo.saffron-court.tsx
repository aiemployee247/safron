import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";

import { placeRestaurantOrder, requestTableBooking } from "../lib/api/restaurant.functions";
import { MENU, MENU_BY_ID } from "../lib/restaurant-menu";

export const Route = createFileRoute("/demo/saffron-court")({
  head: () => ({
    meta: [
      { title: "Saffron Court — Order Online & Book a Table" },
      { name: "description", content: "A real ordering + table-booking demo built by the Pit Crew for the restaurant website project." },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;1,500&family=Work+Sans:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: SaffronCourtDemo,
});

function money(cents: number) {
  return "$" + (cents / 100).toFixed(2);
}

type CartLine = { id: string; qty: number };

function SaffronCourtDemo() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("pickup");
  const [orderState, setOrderState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [orderResult, setOrderResult] = useState<{ orderId: string; subtotalCents: number; etaMinutes: number } | null>(null);
  const [orderError, setOrderError] = useState("");

  const [bookingState, setBookingState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [bookingResult, setBookingResult] = useState<{ bookingId: string } | null>(null);
  const [bookingError, setBookingError] = useState("");

  const subtotalCents = useMemo(
    () => cart.reduce((sum, line) => sum + (MENU_BY_ID[line.id]?.priceCents ?? 0) * line.qty, 0),
    [cart],
  );

  function addToCart(id: string) {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id, qty: 1 }];
    });
  }
  function setQty(id: string, qty: number) {
    setCart((prev) => (qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l))));
  }

  async function onCheckout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setOrderState("busy");
    try {
      const res = await placeRestaurantOrder({
        data: {
          name: String(fd.get("name") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          fulfillment,
          address: String(fd.get("address") ?? ""),
          items: cart.map((l) => ({ id: l.id, qty: l.qty })),
        },
      });
      if (res.ok) {
        setOrderResult(res);
        setOrderState("done");
        setCart([]);
      } else {
        setOrderError(res.error);
        setOrderState("error");
      }
    } catch {
      setOrderError("Something went wrong placing the order. Try again.");
      setOrderState("error");
    }
  }

  async function onBook(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBookingState("busy");
    try {
      const res = await requestTableBooking({
        data: {
          name: String(fd.get("bname") ?? ""),
          phone: String(fd.get("bphone") ?? ""),
          partySize: Number(fd.get("partySize") ?? 2),
          date: String(fd.get("date") ?? ""),
          time: String(fd.get("time") ?? ""),
          notes: String(fd.get("notes") ?? ""),
        },
      });
      if (res.ok) {
        setBookingResult(res);
        setBookingState("done");
      } else {
        setBookingError(res.error);
        setBookingState("error");
      }
    } catch {
      setBookingError("Something went wrong requesting the booking. Try again.");
      setBookingState("error");
    }
  }

  return (
    <div className="sc-page">
      <style>{`
        .sc-page { background: var(--sc-cream); color: var(--sc-ink); font-family: 'Work Sans', system-ui, sans-serif; min-height: 100vh; }
        .sc-page { --sc-maroon:#6b1f2a; --sc-terracotta:#c1592f; --sc-gold:#d9a441; --sc-cream:#fbf3e3; --sc-ink:#241512; --sc-card:#fffaf1; }
        .sc-hero { background: linear-gradient(160deg, var(--sc-maroon), #4a1620); color: var(--sc-cream); padding: 56px 20px 72px; text-align: center; }
        .sc-hero h1 { font-family: 'Fraunces', Georgia, serif; font-size: clamp(2.2rem, 6vw, 3.4rem); font-weight: 700; margin: 0; }
        .sc-hero em { font-style: italic; color: var(--sc-gold); }
        .sc-hero p { max-width: 46ch; margin: 14px auto 0; opacity: 0.85; font-size: 15px; }
        .sc-nav { display: flex; justify-content: center; gap: 10px; margin-top: 26px; flex-wrap: wrap; }
        .sc-nav a { color: var(--sc-cream); text-decoration: none; border: 1px solid rgba(251,243,227,0.35); padding: 8px 18px; border-radius: 999px; font-size: 13px; letter-spacing: 0.04em; }
        .sc-wrap { max-width: 1080px; margin: 0 auto; padding: 40px 20px 100px; display: grid; grid-template-columns: 1fr; gap: 32px; }
        @media (min-width: 900px) { .sc-wrap { grid-template-columns: 2fr 1fr; align-items: start; } }
        .sc-section-title { font-family: 'Fraunces', Georgia, serif; font-size: 26px; margin: 0 0 4px; }
        .sc-cat { margin-bottom: 30px; }
        .sc-cat h3 { font-family: 'Fraunces', Georgia, serif; font-size: 19px; color: var(--sc-terracotta); border-bottom: 2px solid var(--sc-gold); display: inline-block; padding-bottom: 4px; margin-bottom: 12px; }
        .sc-item { display: flex; justify-content: space-between; gap: 14px; background: var(--sc-card); border: 1px solid rgba(107,31,42,0.1); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
        .sc-item .name { font-weight: 600; font-size: 15px; }
        .sc-item .desc { font-size: 13px; opacity: 0.7; margin-top: 2px; }
        .sc-item .price { font-weight: 700; color: var(--sc-maroon); margin-top: 6px; font-size: 14px; }
        .sc-tag { display: inline-block; font-size: 10px; padding: 1px 7px; border-radius: 999px; margin-left: 6px; vertical-align: middle; }
        .sc-tag.veg { background: #dff2df; color: #2b6b2b; }
        .sc-tag.nonveg { background: #f6dede; color: #8a2b2b; }
        .sc-add { background: var(--sc-maroon); color: var(--sc-cream); border: none; border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer; align-self: center; white-space: nowrap; }
        .sc-add:hover { background: var(--sc-terracotta); }
        .sc-cart { position: sticky; top: 20px; background: var(--sc-card); border: 1px solid rgba(107,31,42,0.15); border-radius: 14px; padding: 20px; }
        .sc-cart h3 { font-family: 'Fraunces', Georgia, serif; margin-top: 0; }
        .sc-cart-line { display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed rgba(0,0,0,0.08); }
        .sc-qty { display: inline-flex; align-items: center; gap: 6px; }
        .sc-qty button { width: 22px; height: 22px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.15); background: #fff; cursor: pointer; }
        .sc-total { display: flex; justify-content: space-between; font-weight: 700; margin-top: 12px; font-size: 15px; }
        .sc-field { margin-bottom: 12px; }
        .sc-field label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
        .sc-field input, .sc-field textarea, .sc-field select { width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.18); font-family: inherit; font-size: 14px; box-sizing: border-box; }
        .sc-radio-row { display: flex; gap: 14px; margin-bottom: 12px; }
        .sc-radio-row label { display: flex; align-items: center; gap: 6px; font-size: 13px; }
        .sc-submit { width: 100%; background: var(--sc-terracotta); color: #fff; border: none; border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 6px; }
        .sc-submit:disabled { opacity: 0.6; cursor: default; }
        .sc-confirm { background: #eef7ee; border: 1px solid #bfe0bf; color: #234d23; padding: 14px; border-radius: 10px; font-size: 14px; }
        .sc-error { background: #fdeceb; border: 1px solid #f2b8b2; color: #7a1f18; padding: 14px; border-radius: 10px; font-size: 14px; }
        .sc-book-panel { max-width: 1080px; margin: 0 auto 90px; padding: 0 20px; }
        .sc-book-card { background: var(--sc-card); border: 1px solid rgba(107,31,42,0.15); border-radius: 14px; padding: 24px; max-width: 520px; }
        .sc-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      `}</style>

      <header className="sc-hero">
        <h1>Saffron <em>Court</em></h1>
        <p>Dum-cooked biryani, tandoor classics, and a table when you want one — order online or reserve ahead.</p>
        <nav className="sc-nav">
          <a href="#menu">Order online</a>
          <a href="#book">Book a table</a>
        </nav>
      </header>

      <div className="sc-wrap" id="menu">
        <div>
          <h2 className="sc-section-title">Menu</h2>
          <p style={{ opacity: 0.7, fontSize: 14, marginTop: 0 }}>Every item below is priced and validated server-side — the cart total shown is always recomputed at checkout, never taken from the browser.</p>
          {MENU.map((cat) => (
            <div className="sc-cat" key={cat.key}>
              <h3>{cat.name}</h3>
              {cat.items.map((item) => (
                <div className="sc-item" key={item.id}>
                  <div>
                    <div className="name">
                      {item.name}
                      <span className={`sc-tag ${item.veg ? "veg" : "nonveg"}`}>{item.veg ? "VEG" : "NON-VEG"}</span>
                      {item.spice > 0 && <span className="sc-tag" style={{ background: "#fbe7d4", color: "#a15414" }}>{"🌶".repeat(item.spice)}</span>}
                    </div>
                    <div className="desc">{item.description}</div>
                    <div className="price">{money(item.priceCents)}</div>
                  </div>
                  <button className="sc-add" onClick={() => addToCart(item.id)}>Add</button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <aside className="sc-cart">
          <h3>Your order</h3>

          {orderState === "done" && orderResult ? (
            <div className="sc-confirm">
              Order <b>{orderResult.orderId}</b> placed — {money(orderResult.subtotalCents)}, ready in ~{orderResult.etaMinutes} min.
            </div>
          ) : (
            <>
              {cart.length === 0 && <p style={{ fontSize: 13, opacity: 0.7 }}>Nothing in the cart yet — add a dish to get started.</p>}
              {cart.map((line) => {
                const item = MENU_BY_ID[line.id];
                if (!item) return null;
                return (
                  <div className="sc-cart-line" key={line.id}>
                    <span>{item.name}</span>
                    <span className="sc-qty">
                      <button type="button" onClick={() => setQty(line.id, line.qty - 1)}>−</button>
                      {line.qty}
                      <button type="button" onClick={() => setQty(line.id, line.qty + 1)}>+</button>
                    </span>
                  </div>
                );
              })}
              {cart.length > 0 && (
                <>
                  <div className="sc-total"><span>Subtotal</span><span>{money(subtotalCents)}</span></div>

                  <form onSubmit={onCheckout} style={{ marginTop: 14 }}>
                    <div className="sc-radio-row">
                      <label><input type="radio" name="ff" checked={fulfillment === "pickup"} onChange={() => setFulfillment("pickup")} /> Pickup</label>
                      <label><input type="radio" name="ff" checked={fulfillment === "delivery"} onChange={() => setFulfillment("delivery")} /> Delivery</label>
                    </div>
                    <div className="sc-field"><label>Name</label><input name="name" required /></div>
                    <div className="sc-field"><label>Phone</label><input name="phone" required /></div>
                    {fulfillment === "delivery" && (
                      <div className="sc-field"><label>Delivery address</label><input name="address" required /></div>
                    )}
                    {orderState === "error" && <div className="sc-error" style={{ marginBottom: 10 }}>{orderError}</div>}
                    <button className="sc-submit" disabled={orderState === "busy"}>
                      {orderState === "busy" ? "Placing order…" : `Place order — ${money(subtotalCents)}`}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </aside>
      </div>

      <div className="sc-book-panel" id="book">
        <h2 className="sc-section-title">Book a table</h2>
        <p style={{ opacity: 0.7, fontSize: 14, marginTop: 0, marginBottom: 20 }}>Open 11:30–15:00 and 18:00–22:30. We hold {72} seats per slot — book ahead on busy nights.</p>
        <div className="sc-book-card">
          {bookingState === "done" && bookingResult ? (
            <div className="sc-confirm">Table request <b>{bookingResult.bookingId}</b> confirmed — see you then.</div>
          ) : (
            <form onSubmit={onBook}>
              <div className="sc-row2">
                <div className="sc-field"><label>Name</label><input name="bname" required /></div>
                <div className="sc-field"><label>Phone</label><input name="bphone" required /></div>
              </div>
              <div className="sc-row2">
                <div className="sc-field"><label>Date</label><input name="date" type="date" required /></div>
                <div className="sc-field"><label>Time</label><input name="time" type="time" required /></div>
              </div>
              <div className="sc-field">
                <label>Party size</label>
                <select name="partySize" defaultValue="2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                  ))}
                </select>
              </div>
              <div className="sc-field"><label>Notes (optional)</label><textarea name="notes" rows={2} /></div>
              {bookingState === "error" && <div className="sc-error" style={{ marginBottom: 10 }}>{bookingError}</div>}
              <button className="sc-submit" disabled={bookingState === "busy"}>
                {bookingState === "busy" ? "Requesting…" : "Request table"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
