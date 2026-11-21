# Herloom — Shopify theme

A custom Shopify Online Store 2.0 theme for **Herloom** (herloom.in): premium made-to-order shirts, only for women.
The flow is **feel the brand → discover the collection → shop the pieces**.

It uses Liquid, one CSS file of design tokens and a small vanilla JS file. There's no build step, no framework and no app dependencies.

---

## 1. Structure

```
layout/       theme.liquid (main) · password.liquid (coming-soon page)
templates/    JSON templates. Every section can be edited and reordered in the theme editor.
  index.json                 Homepage, in brief order: hero → intro → grid → shop-the-look → moods → atelier → signature → fabrics → newsletter
  collection.json            PLP, reused for moods, styles, fabrics and edits (they are all collections)
  product.json               PDP → style-it → complete-the-look → you may also like
  page.atelier / lookbook / fabrics / about / faq / contact / track-order / size-guide .json
  customers/*.json           account, order (production timeline), login, register, addresses, reset, activate
sections/     one file per section, each with its own {% schema %}
snippets/     product-card, price, media-image, cart drawer, size guide, measurement fields, order timeline, icons, SEO
assets/       base.css (tokens + globals) · sections.css (components) · theme.js (all behaviour)
config/       settings_schema.json (colours, fonts, lead time…) · settings_data.json
locales/      en.default.json (all UI copy in brand voice)
setup/        metafields.graphql · collections.graphql · menus.md · products.csv (16 sample shirts)
```

### Design system
Tokens live on `:root` in `assets/base.css` and can be overridden from **Theme settings → Colours**:
`--ivory #F7F4EF` · `--white` · `--ink #151413` · `--stone #8C857C` · `--sand #E6DFD4` · `--clay #9A5B45` (accent, used sparingly).
Type is Instrument Serif (display) + Manrope (UI) from Google Fonts. To use licensed fonts (Canela, Neue Haas…), upload `.woff2` files to `assets/` and switch **Theme settings → Typography → Self-hosted**.
Spacing uses an 8px scale, a 12-column grid and a 1440px max width. Product images are 4:5; editorial images are 2:3 and 21:9. Motion is a fade-and-rise under 600ms, and it's turned off under `prefers-reduced-motion`.

---

## 2. How made-to-order works

| Piece | How |
|---|---|
| "Made to order" badge | `settings.default_made_to_order` (on by default), overridable per product with metafield `custom.made_to_order` |
| Lead time | `custom.lead_time_days`, falling back to **Theme settings → Made to order → Default lead time**. Shown on the PDP, in the bag and in the cart |
| Fit option | Line-item property `Fit` (Relaxed / Regular / Tailored). Can be configured in the PDP section |
| Custom measurements | The "Make it to my measurements" toggle adds line-item properties `Bust`, `Waist`, `Shoulder`, `Sleeve length` and `Shirt length`, plus a hidden flag `_custom_fit`. They're saved on the device (localStorage). For logged-in customers they're also saved to the account by the Flow below |
| Inventory | Variants use inventory policy `continue` with no tracking, so products never sell out (see `products.csv`) |
| Production stages | **Order tags**, added in Admin → Orders (or by Flow): `stage-cut` → `stage-stitching` → `stage-finishing` → `stage-dispatched` (fulfilling also counts) → `stage-delivered` |
| Maker note / photo | Order metafields `custom.maker_name`, `custom.stage_note` and `custom.stage_photo` (e.g. "Your shirt is being stitched by Meera") |
| Tracking page | `/account/orders/…` (timeline) and `/pages/track-order` (recent orders, or a guest explainer) |

**Shopify Flow recipes** (Flow is a free app):
1. *Order created → for each line item with property `_custom_fit` → set customer metafield `custom.measurements` (JSON)*, so measurements prefill next time.
2. *Order tags added → `stage-*` → send customer notification / WhatsApp*, via Shopify Email or a WhatsApp app such as Interakt or WATI. **[confirm channels]**

> The order timeline needs **classic customer accounts** (Settings → Customer accounts → Classic). The newer customer accounts don't use theme templates. With new accounts, show the stages through an Order Status page app block instead.

---

## 3. Payments: Razorpay

Razorpay connects through Shopify Checkout, so the theme needs no code for it.
1. Admin → **Settings → Payments → Add payment methods → search "Razorpay"** → Activate, then log in with your Razorpay merchant account (Key ID/Secret are entered there, never in the theme).
2. Razorpay Dashboard → enable UPI, cards, netbanking and wallets. Turn on **Magic Checkout** if wanted.
3. Store currency: **INR**. For international orders, enable Shopify Markets. The footer country/currency selector appears automatically when more than one market is active.

---

## 4. Store setup (one time)

1. **Metafields**: run `setup/metafields.graphql` (Admin → Apps → *Shopify GraphiQL App*).
2. **Collections**: run `setup/collections.graphql`. These are smart collections driven by tags (`mood:resort`, `fabric:linen`, `style:camp-collar`, `new-in`, `signature`, `bestseller`).
3. **Products**: Admin → Products → **Import** → `setup/products.csv` (16 shirts × colours × XS–XXL, imported as **draft**). Prices are placeholders **[final pricing]**. Add photos, then set the products to Active.
4. **Menus and pages**: follow `setup/menus.md`.
5. **Search & Discovery app** (free): add filters for Mood (`custom.moods`), Fabric (`custom.fabric`), Colour, Size, Availability and Price. They then appear in the PLP filter drawer automatically.
6. **Theme**: upload the zip (Online Store → Themes → Add theme → Upload zip), or use the CLI:
   ```bash
   shopify theme push --store herloom.myshopify.com --unpublished
   ```
   Create the collections and pages first so the template references resolve.
7. **Theme editor**: add the hero video/poster, the mood tile images, the Shop-the-Look hotspots and so on. Every image slot shows a neutral placeholder until it's filled.
8. **Domain**: Settings → Domains → connect `herloom.in`.
9. **Analytics**: install the *Google & YouTube* app (GA4) and the *Facebook & Instagram* app (Meta Pixel). E-commerce events (view_item, add_to_cart, begin_checkout, purchase) are sent through Shopify Customer Events. The cookie banner is under Settings → Customer privacy.

## 5. Photography

The shoot (100+ JPEGs, ~30MB each) needs resizing before upload. Export at **2400px on the long edge, JPEG quality 82, sRGB** (~400–700KB each). Shopify serves AVIF/WebP and responsive sizes automatically through `image_url` + `srcset`.
- Hero: 1 landscape image (desktop) + 1 portrait image (mobile). Optional 6–12s MP4 under 5MB in each orientation
- Product: 3–5 images per shirt. Image 1 on white/ivory (shown on cards), image 2 on model (shown on card hover)
- Moods: 5 portraits (3:4). Atelier: hands, cutting, stitching. Fabrics: 4–5 macro shots

## 6. Adding things later
- **New product**: tag it `mood:…`, `fabric:…`, `style:…` (plus `new-in` if new). Fill the metafields (Moods, Fabric, Lead time…). It shows up in the right collections, menus and filters on its own.
- **New mood or edit**: create a smart collection (by tag), add it to the `shop-by-mood` menu and a Mood tile on the homepage.
- **New campaign**: duplicate `page.lookbook`, or edit the Lookbook page in the theme editor. Then update the hero and the mega-menu campaign tile.

## 7. Performance, accessibility, SEO
- The hero poster is `fetchpriority=high`; everything else lazy-loads. Video doesn't autoplay on Save-Data, 2G or reduced-motion, and has a pause button.
- Focus-trapped drawers close with Esc. Hotspots are keyboard operable. Touch targets are at least 44px and there's a skip link.
- There's one H1 per page. JSON-LD covers Organization, Product and BreadcrumbList. Open Graph and Twitter tags are included. Shopify generates the canonical URL, sitemap.xml and robots.txt.
