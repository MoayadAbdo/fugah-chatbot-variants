/**
 * FUQAH WIDGET LOADER
 * =====================================================
 * WHERE THIS FILE LIVES: Vercel (same repo as widget.js)
 * URL: https://fugah-chatbot-variantsssz.vercel.app/widget-loader.js
 *
 * WHAT IT DOES:
 * - Reads data-store-id from the script tag
 * - Creates a full-viewport iframe pointing to widget-frame.html
 * - Passes storeId via URL param (no host DOM access needed)
 * - Keeps pointer-events:none by default so the store page is fully usable
 * - Listens for postMessage from the iframe to enable/disable pointer events
 *   (only active when chat bubble or panel is being interacted with)
 *
 * SNIPPET TO INJECT IN SALLA (Custom HTML block / Partner App):
 * <script src="https://fugah-chatbot-variantsssz.vercel.app/widget-loader.js"
 *         data-store-id="{{store.id}}"></script>
 *
 * SNIPPET TO INJECT IN ZID (Theme footer / Partner App):
 * <script src="https://fugah-chatbot-variantsssz.vercel.app/widget-loader.js"
 *         data-store-id="{{store_uuid}}"></script>
 * =====================================================
 */
(function () {
  // ── 1. Read store ID from this script tag ──────────────────────────────────
  var currentScript = document.currentScript;
  var storeId = currentScript ? currentScript.getAttribute("data-store-id") : null;

  if (!storeId) {
    console.warn("[Fuqah] Missing data-store-id on script tag. Widget will not load.");
    return;
  }

  // ── 2. Build iframe src URL ────────────────────────────────────────────────
  var WIDGET_BASE = "https://fugah-chatbot-variantsssz.vercel.app";
  var iframeSrc = WIDGET_BASE + "/widget-frame.html?storeId=" + encodeURIComponent(storeId);

  // ── 3. Create the iframe ───────────────────────────────────────────────────
  var iframe = document.createElement("iframe");
  iframe.id = "fuqah-widget-frame";
  iframe.src = iframeSrc;
  iframe.setAttribute("allow", "microphone");
  iframe.setAttribute("allowtransparency", "true");
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("title", "Fuqah Chat Widget");
  iframe.setAttribute("aria-label", "Chat Support");

  /*
   * KEY STYLE CHOICES:
   * - position:fixed + full viewport coverage so the inner widget can freely
   *   position its bubble and panel anywhere
   * - pointer-events:none by default — the host store page receives all clicks
   *   normally. The iframe only activates pointer events when the widget signals
   *   it needs interaction (via postMessage fuqah:active)
   * - background:transparent — iframe background is see-through
   * - z-index just below maximum to avoid conflicting with Salla/Zid own modals
   *   (their checkout overlays use 2147483647)
   */
  iframe.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: 0",
    "width: 100vw",
    "height: 100%",
    "border: none",
    "background: transparent",
    "pointer-events: none",
    "z-index: 2147483640",
    "overflow: hidden",
  ].join(" !important; ") + " !important;";

  // ── 4. Inject iframe into body ─────────────────────────────────────────────
  function inject() {
    if (document.body) {
      document.body.appendChild(iframe);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        document.body.appendChild(iframe);
      });
    }
  }
  inject();

  // ── 5. postMessage bridge ──────────────────────────────────────────────────
  /*
   * The iframe sends messages to control pointer events on the host page:
   *
   * { type: "fuqah:active" }   → chat is open or bubble is hovered, enable pointer events
   * { type: "fuqah:inactive" } → chat is closed, disable pointer events (pass through to store)
   *
   * This is the ONLY cross-frame communication needed for basic functionality.
   * Future events (e.g. fuqah:resize for bubble position) can be added here.
   */
  window.addEventListener("message", function (event) {
    // Security: only accept messages from our own widget origin
    if (event.origin !== WIDGET_BASE) return;

    var data = event.data;
    if (!data || typeof data.type !== "string") return;

    switch (data.type) {
      case "fuqah:active":
        // User is interacting with widget — enable clicks on iframe
        iframe.style.setProperty("pointer-events", "auto", "important");
        break;

      case "fuqah:inactive":
        // Widget idle — pass all clicks through to host store
        iframe.style.setProperty("pointer-events", "none", "important");
        break;

      case "fuqah:resize":
        // Optional: future use for dynamic iframe sizing on mobile
        if (data.width) iframe.style.setProperty("width", data.width, "important");
        if (data.height) iframe.style.setProperty("height", data.height, "important");
        break;

      default:
        break;
    }
  });
})();
