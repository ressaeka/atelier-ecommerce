# Frontend UI Alignment — Change Log

Target design: the five Figma screenshots embedded in `desain.docx`.
The document contained no text, only images. The grey labels at the top of each
frame ("login", "FAVORIT", "Detail Pesanan", "pembayaran", "Keranjang") are Figma
frame names and were deliberately **not** rendered as UI.

## Palette sampled from the screenshots

| Token | Hex | Used for |
|---|---|---|
| Page | `#F5F5F5` | Outer page background |
| Card | `#FDFAF7` | Main content card / action bars |
| Strip | `#EFEEEA` | Section headers, variant pills, panels |
| List | `#D9D9D9` | List surfaces, inner blocks, voucher bar |
| Ink | `#1A1A1A` / `#0A0A0A` | Primary text and buttons |
| Heart | `#F44336` | Filled favourite icon |
| Accent | `#C1603C` / `#E8916B` | Active step, promo, guarantee badge |

Typography throughout is the existing `Libre Bodoni` serif — headings, product
names, prices, column labels and button text alike, matching the reference.

## Files added

| File | Purpose |
|---|---|
| `src/components/CommerceUI.tsx` | Shared primitives: cream section strip, `VARIAN` pill, square selector, `- 1X +` stepper, `formatRp` (`RP.890.000` form) |
| `src/contexts/WishlistContext.tsx` | Favourite selection store |
| `src/lib/orders.ts` | Order history store + VA number helper |
| `src/pages/Payment.tsx` | New Pembayaran screen |

## Files modified

| File | Change |
|---|---|
| `src/pages/Cart.tsx` | Restyled to screenshot 5 |
| `src/pages/Wishlist.tsx` | Was a `PlaceholderPage` stub — now screenshot 2 |
| `src/pages/Orders.tsx` | Was a `PlaceholderPage` stub — now screenshot 3 |
| `src/App.tsx` | Added `WishlistProvider` + `/payment` route |
| `src/components/Navbar.tsx` | Heart badge reads the wishlist store (prop still wins if passed) |
| `src/components/ProductCard.tsx` | Heart toggles real favourite state |
| `src/pages/Catalog.tsx` | Heart toggles real favourite state |
| `src/pages/ProductDetail.tsx` | Wishlist button reflects and toggles state |

`Login.tsx`, `Register.tsx` and `AuthLayout.tsx` were already built from
screenshot 1 and needed no change.

## Preserved

- Framework (React 18 + Vite + Tailwind + react-router 6) and project structure.
- All routes; `/payment` is additive.
- `AuthContext` / `CartContext` and every existing API call
  (`/auth/*`, `/users/me`, `/product`, `/category`, `/cart`, `/cart/items`).
- Token refresh, Google OAuth, guest access, the 401 flow.
- `AnnouncementBar`, `Navbar`, `Footer`, `resolveImageUrl`, `formatPrice`.

## Data-layer note

`src/types/api.ts` defines no wishlist and no order resource, and the brief
forbids inventing endpoints. So:

- **Favourites** — the *selection* (product ids) persists in `localStorage`;
  product data is always re-read through the existing `GET /product`, so names,
  prices and images stay server-authoritative.
- **Orders** — records persist in `localStorage` behind
  `listOrders` / `getOrder` / `saveOrder` / `setOrderStatus`.

Both are isolated behind small functions. When real endpoints exist, swap those
function bodies for `api.get` / `api.post` calls; no page component changes.

The payment page reads addresses from `GET /address` (already in the API
contract) and degrades to profile fields if it returns nothing.

## Deviations from the reference, and why

1. **Variant dropdowns are display-only.** The `Product` type has no variant
   field. The pill is rendered exactly as designed and `VariantSelect` already
   accepts `options` / `onChange` for when the backend supplies them.
2. **`CETAK BUKTI PEMBAYARAN` is disabled until payment completes.** The
   screenshot shows the verified end state. The label is always present as
   designed; only the enabled state is gated, since printing a receipt before
   paying would be wrong.
3. **Announcement bar sits above the Orders card.** Screenshot 3 shows the
   navbar as the first element inside the card with no black strip, but the bar
   is global chrome on every other page, so it was moved above rather than
   removed.

## Verification

- `tsc --noEmit -p tsconfig.app.json` — no errors in any new or modified file.
  Four errors remain in `ProfileDropdown.tsx` and `lib/api.ts`; these are
  pre-existing in files that were not touched and were deliberately left alone.
- All six affected pages server-render without error, and the design elements
  (section strips, voucher bar, status tabs, stepper, VA block, instruction
  columns, action bars) were asserted present in the rendered output.
- A full `vite build` could **not** be run here: the bundled `node_modules`
  ships only win32 native binaries for `rollup` and `esbuild`, and this sandbox
  has no network. Run `npm install` on your machine before building.
