# Fugah Chatbot Widget

Embeddable chat widget for any site, **Salla**, and **Zid** partner apps.  
Recommended integration uses a **transparent iframe** (`widget-loader.js` + `widget-frame.html`) so the store page stays clickable until the user interacts with the chat; the inner `widget.js` talks to the parent via `postMessage` (`fuqah:active` / `fuqah:inactive`).

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) to test the widget.

## Deploy to Vercel

1. Push this repo to GitHub (or connect your existing repo).
2. In [Vercel](https://vercel.com): **Add New Project** → import the repository.
3. **Framework preset:** Other (or Vite). Vercel auto-detects `vercel.json`:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. **Node.js:** 18.x or newer (see `package.json` `engines`).
5. Deploy. Your widget base URL will be `https://<your-project>.vercel.app` (or your custom domain).

**Published files (from `dist/`):** `widget.js`, `widget.css`, `ui.html`, `assets/**`, `widget-loader.js`, `widget-frame.html`, `index.html` (dev demo).  
Iframe sources live in `embed/` and are copied into `test/public/` during `prebuild` / `predev`.

**Snippet URLs** (replace `YOUR_VERCEL_DOMAIN` with your deployment host, no trailing slash):

- `https://YOUR_VERCEL_DOMAIN/widget-loader.js` — load this in Salla/Zid (recommended).
- `https://YOUR_VERCEL_DOMAIN/widget-frame.html` — loaded by the loader (do not embed manually).

### Environment

No environment variables are required for static hosting. The widget calls the Supabase Edge Function URL configured in `test/widget.js` (`data-api-url` on the script tag overrides the default).

## Merchant embed (recommended): iframe loader

Use **`widget-loader.js`** with **`data-store-id`** set to each merchant’s store identifier (from your partner app / OAuth).

Copy the contents of **`salla-embed-snippet.html`** or **`zid-embed-snippet.html`** from this repo and replace `YOUR_VERCEL_DOMAIN` and store id placeholders.

## Optional: direct script (no iframe)

You can load **`widget.js`** directly on the storefront (same origin / CDN base as assets). The script resolves `widget.css` and assets from its own URL. See comments in `salla-embed-snippet.html` for the direct variant.

## Salla partner app

1. Deploy as above so all files sit under one base URL.
2. Add the **loader** snippet from `salla-embed-snippet.html` in the Partner Portal → App Snippets (use `{{ store_id }}` or the variable your app provides).
3. See **docs/SALLA-PARTNER-APP.md** (if present) for marketplace steps.

## Zid partner app

1. Deploy as above.
2. In Zid Partner Dashboard → **General Settings** → **Add Snippet**, paste the contents of **`zid-embed-snippet.html`** (footer / before `</body>`).
3. Ensure **`data-store-id`** is set per merchant (replace the placeholder with your app’s store id field).
