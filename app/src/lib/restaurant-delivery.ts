// Delivery-radius check for online orders. Saffron Court only delivers within a
// fixed radius of its kitchen. An address is resolved to a US ZIP code, and that
// ZIP is looked up against the kitchen's known service area. Three failure modes
// are kept distinct so the customer gets the right nudge:
//   - no ZIP-shaped token in the address at all        → ask them to fix it
//   - a valid ZIP we simply don't serve                 → out-of-area, offer pickup
//   - a known ZIP that sits beyond the radius           → out-of-range, offer pickup
// Distances are approximate demo data — not sourced from any real geocoder.

export const DELIVERY_RADIUS_MILES = 6;

// Known ZIPs around the kitchen, mapped to their approximate straight-line
// distance in miles. A ZIP that isn't in this table can't be resolved; a ZIP
// that is but sits past DELIVERY_RADIUS_MILES is out of range.
const ZIP_DISTANCE_MILES: Record<string, number> = {
  "78701": 0.0,
  "78702": 2.1,
  "78703": 2.4,
  "78704": 3.2,
  "78705": 2.8,
  "78722": 3.6,
  "78751": 4.1,
  "78723": 5.2,
  "78741": 5.8,
  "78745": 7.9,
  "78753": 9.6,
  "78748": 11.4,
};

// Pull the US-style 5-digit ZIP (optionally ZIP+4) out of a free-form address
// string. A US ZIP conventionally sits at the end of the address, so when more
// than one 5-digit token is present (e.g. a 5-digit house number) we take the
// last — the leading number is the street number, not the ZIP. Returns null
// when there's no ZIP-shaped token at all.
export function extractZip(address: string): string | null {
  const matches = address.match(/\b\d{5}(?:-\d{4})?\b/g);
  return matches ? matches[matches.length - 1].slice(0, 5) : null;
}

export type DeliveryCheck =
  | { status: "ok"; zip: string; distanceMiles: number }
  | { status: "unresolved" }
  | { status: "out_of_area"; zip: string }
  | { status: "out_of_range"; zip: string; distanceMiles: number };

// Resolve a delivery address to a ZIP and decide whether we can deliver to it.
export function checkDeliveryAddress(address: string): DeliveryCheck {
  const zip = extractZip(address);
  if (!zip) return { status: "unresolved" };
  // A well-formed ZIP we don't serve isn't a typo — the customer's input is
  // fine, we just don't deliver there. Keep it distinct from "unresolved".
  if (!(zip in ZIP_DISTANCE_MILES)) return { status: "out_of_area", zip };
  const distanceMiles = ZIP_DISTANCE_MILES[zip];
  if (distanceMiles > DELIVERY_RADIUS_MILES) return { status: "out_of_range", zip, distanceMiles };
  return { status: "ok", zip, distanceMiles };
}
