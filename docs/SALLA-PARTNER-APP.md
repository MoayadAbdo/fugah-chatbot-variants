# Fugah Chatbot Widget – Salla Partner App Guide

This guide explains how to list the Fugah chatbot widget as a **partner app** on Salla so merchants can install it on their stores.

## Overview

- **Salla** is an e-commerce platform; merchants run their stores on Salla.
- **Partner apps** are listed on the [Salla Apps Marketplace](https://apps.salla.sa/en). Merchants install your app; you can charge a subscription or one-time fee.
- The widget is injected into the merchant’s storefront via **App Snippets** (a script tag that Salla injects on store pages).

## 1. Prerequisites

- [Salla Partners account](https://salla.partners/) (verified).
- Widget files deployed to a **CDN** so every store can load the same script and assets from one base URL.

## 2. Deploy the widget to a CDN

The widget must be loaded from a **single base URL** that serves:

- `widget.js`
- `widget.css`
- `ui.html`
- `assets/` (all images and other assets)

Example layout on your server/CDN:

```text
https://cdn.yourdomain.com/widget/v1/
├── widget.js
├── widget.css
├── ui.html
└── assets/
    ├── message.png
    ├── main-bg.png
    ├── … (all other assets from test/assets/)
```

- Copy from your project: everything under `test/` (e.g. `widget.js`, `widget.css`, `ui.html`, and the whole `assets/` folder).
- Upload to your CDN at the base URL you will use in the snippet (e.g. `https://cdn.yourdomain.com/widget/v1/`).
- Ensure CORS allows stores (e.g. `*.salla.sa` or your store domains) if you ever fetch from the store page.

The widget code already uses the script’s `src` to resolve this base URL, so it works on any merchant domain.

## 3. Create your app on Salla Partners Portal

1. Go to [Salla Partners Portal](https://portal.salla.partners/) and sign in.
2. Open **My Apps** → **Create App**.
3. Choose **Public** (to list on the marketplace) or **Private** (for selected merchants).
4. Fill in:
   - **Name** (English and Arabic)
   - **Category** (e.g. General)
   - **Description**, **App website**, **Support email**
   - **Icon** (e.g. 250×250 px)
5. Create the app and complete any required verification steps.

## 4. Add the widget via App Snippets

1. In the portal, open your app → **App Details**.
2. Find **App Snippets** and click **View Snippets**.
3. Add a snippet that injects the Fugah widget script.

Use the same snippet as in `salla-embed-snippet.html`, but with:

- **Base URL**: your CDN base (e.g. `https://cdn.yourdomain.com/widget/v1`).
- **Store ID**: per-merchant identifier.

Snippet format:

```html
<script
  src="https://cdn.yourdomain.com/widget/v1/widget.js"
  charset="UTF-8"
  data-store-id="{{store_id}}"
  data-merchant-id="{{merchant_id}}"
  data-theme="green">
</script>
```

- Replace `https://cdn.yourdomain.com/widget/v1` with your real CDN base URL.
- Replace `{{store_id}}` with the value Salla provides for the store (from your app’s OAuth/store context or the variable Salla uses in snippets, if any). If Salla does not provide a placeholder, your backend must supply the store ID when generating the snippet for each merchant.
- `data-theme` can be any of: `green`, `red`, `blue`, `yellow`, `cyan`, `black`, `white`. You can later make this configurable in **App Settings**.

Salla will inject this script on the store’s frontend so the widget loads on every page.

## 5. App settings (optional)

In **App Settings** you can add a form so merchants can:

- Choose **theme** (e.g. dropdown for `data-theme`).
- See a short description of what the widget does.

If you support multiple themes, your app can store the merchant’s choice and either:

- Serve a snippet with the chosen `data-theme`, or  
- Use a small backend that returns the snippet with the right attributes for that store.

## 6. OAuth and store ID

- When a merchant installs your app, use Salla’s OAuth to get access to their store.
- Use the store (or merchant) ID from the OAuth/API response as `data-store-id` in the snippet so your backend can associate conversations and settings with the correct store.

If Salla injects snippets with a placeholder like `{{store_id}}`, use that. Otherwise, generate the snippet per merchant (e.g. from your server) and pass the store ID from your app’s backend.

## 7. Testing

1. Use **App Testing** in the portal with a **demo store**.
2. Install your app on the demo store and confirm the snippet is active.
3. Open the storefront and check that:
   - The widget loads (chat bubble and UI).
   - No console errors.
   - Assets (images, CSS) load from your CDN.

## 8. Publishing

When everything works:

1. In the app details, use **Start Publishing your App**.
2. Complete the steps: Basic Information, App Configurations, App Features, Pricing, Contact, Trial (if any).
3. Submit for review. Once approved, the app will appear on the [Salla Apps Marketplace](https://apps.salla.sa/en).

## Files in this repo

| File / folder | Purpose |
|---------------|--------|
| `test/widget.js` | Widget script (CDN-safe base URL logic included). |
| `test/widget.css` | Widget styles. |
| `test/ui.html` | Widget UI template. |
| `test/assets/` | Images and other assets. |
| `salla-embed-snippet.html` | Example snippet for Salla (replace CDN URL and store ID). |
| `docs/SALLA-PARTNER-APP.md` | This guide. |

## References

- [Create your first app](https://docs.salla.dev/439059m0)
- [Partners Portal](https://portal.salla.partners/)
- [App Snippets](https://salla.dev/blog/a-guide-to-app-snippet/) (concept and usage)
- [Salla Apps Marketplace](https://apps.salla.sa/en)
