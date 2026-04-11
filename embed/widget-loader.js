/**
 * Fugah widget loader — injects a transparent full-viewport iframe that loads widget-frame.html.
 * Host page uses pointer-events:none on the iframe until the inner widget posts fuqah:active.
 * Deploy next to widget.js (same directory on your CDN / Vercel output).
 */
(function () {
  function getLoaderScriptSrc() {
    if (document.currentScript && document.currentScript.src) {
      return document.currentScript.src;
    }
    var nodes = document.querySelectorAll('script[src*="widget-loader"]');
    return nodes.length ? nodes[nodes.length - 1].src : "";
  }

  var scriptSrc = getLoaderScriptSrc();
  if (!scriptSrc) {
    console.warn("[Fugah] widget-loader: could not resolve script URL.");
    return;
  }

  var loaderOrigin = new URL(scriptSrc).origin;
  var widgetBase = scriptSrc.replace(/\/[^/]*$/, "");

  var storeId = null;
  if (document.currentScript) {
    storeId = document.currentScript.getAttribute("data-store-id");
  }
  if (!storeId) {
    var withId = document.querySelectorAll('script[src*="widget-loader"][data-store-id]');
    if (withId.length) {
      storeId = withId[withId.length - 1].getAttribute("data-store-id");
    }
  }

  if (!storeId) {
    console.warn("[Fugah] widget-loader: Missing data-store-id on script tag.");
    return;
  }

  var iframeSrc = widgetBase + "/widget-frame.html?storeId=" + encodeURIComponent(storeId);

  var iframe = document.createElement("iframe");
  iframe.id = "fuqah-widget-frame";
  iframe.src = iframeSrc;
  iframe.setAttribute("allow", "microphone");
  iframe.setAttribute("allowtransparency", "true");
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("title", "Fugah Chat");
  iframe.setAttribute("aria-label", "Chat support");

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

  window.addEventListener("message", function (event) {
    if (event.origin !== loaderOrigin) return;
    var data = event.data;
    if (!data || typeof data.type !== "string") return;

    switch (data.type) {
      case "fuqah:active":
        iframe.style.setProperty("pointer-events", "auto", "important");
        break;
      case "fuqah:inactive":
        iframe.style.setProperty("pointer-events", "none", "important");
        break;
      case "fuqah:resize":
        if (data.width) iframe.style.setProperty("width", data.width, "important");
        if (data.height) iframe.style.setProperty("height", data.height, "important");
        break;
      default:
        break;
    }
  });
})();
