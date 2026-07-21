# Agent Garage design brief

## Design read
Self-taught builders and indie developers who want working AI agents and automations, not theory; the register is confident workshop calm: everything on the page feels serviced, labeled, and ready to use.

## Concept spine
"The site is a service bay." Tutorials are jobs on the bench, the membership is the toolbox, the cursor is the inspection lamp. Every section reads like a station in a well-run garage: labeled, ruled, precise.

## Delivery tier
cinema

## Locked palette
- Ground: `#F3F2ED` cool paper (with a faint blueprint grid)
- Ink: `#14181D` off-black
- Accent (only one): `#2447C6` cobalt ultramarine
- Steel mid-tone: `#8A919C` for rules and secondary text
Defense: cobalt ink on shop-manual paper, the color of blueprint lines and enamel machine badges; Cobalt + Cream, not beige+brass, not dark+neon.

## Locked type
- Display and body: Outfit (Swiss rational hierarchy, tight tracking on display)
- Mono: IBM Plex Mono for commands, labels, form chrome
No serif anywhere.

## Tier-1 technique
B2, Grade-shift interaction pair. Two renders of the same workbench composition: dormant (lights off, cool dark) and alive (work lamp on, cobalt accents lit). A cursor spotlight mask crossfades dormant to lit where the pointer moves; on touch and reduced motion, scroll progress (or static lit state) drives it. Defense: the inspection lamp IS the service-bay spine, the bench comes alive exactly where you point the light. Mobile degradation: spotlight replaced by a scroll-linked vertical sweep; reduced motion shows the lit grade statically.

## Combinatorial pick (held across all boards)
- Theme paradigm: Pristine Light
- Background character: technical grid/dot field (faint blueprint grid on paper)
- Typography character: Swiss rational sans with hard hierarchy
- Hero architecture: image-as-canvas (full-bleed bench scene, text bottom-left)
- Section system: Swiss grid discipline
- Signature components: gapless bento, hover-accordion slices, vertical rhythm lines, off-grid editorial
- Narrative spine: tool / precision instrument
- Second-read moment: macro crop carrying the brand color (cobalt tool macro in the membership section), placed once

## Section plan (home)
1. Hero: image-as-canvas grade-shift bench, text bottom-left over image. Family: full-bleed image hero. Anchor: bottom-left over image.
2. On the bench (featured tutorials): gapless bento, exactly 4 cells with generated covers. Family: bento. Anchor: top-left lead.
3. Tracks (Agents / Automation / Self-hosting): hover-accordion vertical slices. Family: accordion slices. Anchor: stacked center.
4. Services and booking: ruled rows (divide-y), off-grid heading. Family: ruled list. Anchor: off-grid offset.
5. Membership (the toolbox): two-panel free vs All-Access comparison plus the cobalt macro crop. Family: comparison panels. Anchor: centered statement.
6. Shop notes (newsletter): full-width banner with mono input bar. Family: banner band. Anchor: centered statement.
Eyebrow budget: 2 max (used in sections 2 and 5 only).

## Asset plan
- Hero: workbench scene, 2 candidates; winner gets an image-edit re-grade (dormant dark version) for the B2 pair.
- Section plates: blueprint-grid paper texture; cobalt tool macro crop.
- Content imagery: 4 tutorial covers in one technical-illustration style (Inbox Zero Agent, Telegram Ops Bot, Homelab LLM, Desk Mic Assistant) plus 1 services plate.
- Custom icon set: one sheet, 8 glyphs, 2px cobalt stroke, sliced + background removed.
- Logo: AG monogram in a hex-nut outline, favicon head kit derived from it.
- OG image: 1200x630 composed card in the brand language.

## CTA inventory (bespoke chrome, all-sharp corners page-wide)
- "Start learning" (hero primary): solid cobalt block, hard 4px ink offset shadow, depresses on active.
- "Browse tutorials" (hero secondary + nav): inline underline link, arrow slides on hover.
- "Book a session" (services): hairline framed block, floods cobalt on hover.
- "Sign in" (nav + auth): mono label, cobalt corner brackets appear on hover.
- "Unlock All-Access" (membership): full-width banner bar, colors invert on hover, arrow slides.
- "Subscribe" (newsletter): attached mono input + ink block button, cobalt focus ring.
One label per intent page-wide.

## Pages and backend
Home, /tutorials (+ 4 real tutorial pages, 2 gated), /services, /contact, /sign-in, /sign-up, /members (gated library + account). D1: users (with plan), sessions, contact messages, booking requests, newsletter subscribers, upgrade requests. Auth: email + password (PBKDF2 via Web Crypto), httpOnly session cookie.

## Anti-convergence (first build in chat)
All six axes derived from the material world of the trade: steel, enamel badges, shop-manual paper, cobalt blueprint ink. Palette: Cobalt + Cream. Type: Outfit + IBM Plex Mono. Hero: image-as-canvas. Tier-1: B2 grade-shift. Garments: offset-shadow block, underline-arrow, framed flood, corner brackets, banner invert, attached input. Corners: all-sharp.
