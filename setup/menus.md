# Menus (Admin → Online Store → Navigation)

Create these menus with these exact handles. The theme looks them up by handle.

| Handle | Items |
|---|---|
| `main-menu` | New In → /collections/new-in · **Shop** (opens the mega-menu) → /collections/all · Moods → /collections/casual (add the 5 moods as child links for mobile) · Lookbook → /pages/lookbook · Atelier → /pages/atelier |
| `shop-by-mood` | Casual · Smart Casual · Resort · Party & Evening · Statement (link each to its collection; their collection images become the mobile-menu mood tiles) |
| `shop-by-style` | Classic Shirts · Oversized · Cropped · Tie-front · Camp Collar · Sleeveless |
| `shop-by-fabric` | Linen · Cotton Poplin · Silk · Satin · Cotton-Silk |
| `shop-featured` | New In · Signature Pieces · Bestsellers · Shop All |
| `footer-shop` | New In · Shop All · Signature Pieces · Gift card |
| `footer-help` | Track order (/pages/track-order) · Size guide · FAQ · Shipping (/policies/shipping-policy) · Returns & Alterations (/policies/refund-policy) · Contact |
| `footer-about` | Our Story (/pages/about) · The Atelier · Fabrics · Journal (/blogs/journal) · Privacy (/policies/privacy-policy) · Terms (/policies/terms-of-service) |

The menu item called **Shop** opens the mega-menu (you can change the trigger name in Theme editor → Header).

## Pages to create (Admin → Online Store → Pages)

| Title | Handle | Template |
|---|---|---|
| The Atelier | `atelier` | page.atelier |
| Lookbook | `lookbook` | page.lookbook |
| Fabrics | `fabrics` | page.fabrics |
| Our Story | `about` | page.about |
| FAQ | `faq` | page.faq |
| Contact | `contact` | page.contact |
| Track your order | `track-order` | page.track-order |
| Size guide | `size-guide` | page.size-guide (put the size chart + how-to-measure in the page body; also select it in Theme settings → Made to order) |
| Care guide | `care-guide` | page (default) |

Policies (Shipping, Refund/Returns & Alterations, Privacy, Terms) go in Admin → Settings → Policies.
