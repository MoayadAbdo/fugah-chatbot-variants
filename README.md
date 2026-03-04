# Fugah Chatbot Widget

Chatbot widget with theme support, embeddable on any site or via **Salla** as a partner app.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173/ to test the widget.

## Salla partner app (sell to merchants)

To list this widget on the Salla Apps Marketplace and let merchants add it to their stores:

1. **Deploy** the contents of `test/` (widget.js, widget.css, ui.html, assets/) to a CDN under one base URL.
2. Use the **embed snippet** in `salla-embed-snippet.html` (replace `YOUR_CDN_BASE_URL` and store ID).
3. Follow **docs/SALLA-PARTNER-APP.md** to create your app, add the snippet in App Snippets, and publish.

The widget resolves all assets from the script URL, so it works when embedded on any domain (e.g. Salla storefronts).
