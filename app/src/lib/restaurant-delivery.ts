// Delivery-radius check for online orders. Saffron Court only delivers within a
// fixed radius of its kitchen. An address is resolved to a US ZIP code, and that
// ZIP is looked up against the kitchen's known service area. Two failure modes
// are kept distinct so the customer gets the right nudge:
//   - the address doesn't resolve to a ZIP we recognise → ask them to fix it
//   - the ZIP resolves but sits beyond the radius     → out-of-range, offer pickup
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

// Pull the first US-style 5-digit ZIP (optionally ZIP+4) out of a free-form
// address string. Returns null when there's no ZIP-shaped token at all.
export function extractZip(address: string): string | null {
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

export type DeliveryCheck =
  | { status: "ok"; zip: string; distanceMiles: number }
  | { status: "unresolved" }
  | { status: "out_of_range"; zip: string; distanceMiles: number };

// Resolve a delivery address to a ZIP and decide whether we can deliver to it.
export function checkDeliveryAddress(address: string): DeliveryCheck {
  const zip = extractZip(address);
  if (!zip || !(zip in ZIP_DISTANCE_MILES)) return { status: "unresolved" };
  const distanceMiles = ZIP_DISTANCE_MILES[zip];
  if (distanceMiles > DELIVERY_RADIUS_MILES) return { status: "out_of_range", zip, distanceMiles };
  return { status: "ok", zip, distanceMiles };
}
