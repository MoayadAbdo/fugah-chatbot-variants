/**
 * Inlines ui.html into dist/widget.js so the widget never needs to fetch ui.html.
 * This fixes ERR_CONNECTION_RESET when Salla or network blocks/resets the ui.html request.
 * Run as postbuild: npm run build && node scripts/inline-ui-into-dist.js
 */
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const testDir = path.join(__dirname, "..", "test");
const widgetPath = path.join(distDir, "widget.js");
const uiPath = path.join(testDir, "ui.html");

if (!fs.existsSync(widgetPath)) {
  console.error("inline-ui-into-dist: dist/widget.js not found. Run build first.");
  process.exit(1);
}
if (!fs.existsSync(uiPath)) {
  console.error("inline-ui-into-dist: test/ui.html not found.");
  process.exit(1);
}

const uiHtml = fs.readFileSync(uiPath, "utf8");
const inlined = JSON.stringify(uiHtml);

let widgetJs = fs.readFileSync(widgetPath, "utf8");

// Pattern A: placeholder loader block in test/widget.js
const placeholderBlock = /Promise\.resolve\s*\(\s*"__UI_HTML_INLINED__"\s*\)\s*\.then\s*\(\s*html\s*=>\s*\{\s*if\s*\(\s*html\s*===\s*"__UI_HTML_INLINED__"\s*\)\s*\{\s*return\s+fetch\s*\([^)]+\)\.then\s*\(\s*r\s*=>\s*r\.text\s*\(\s*\)\s*\)\s*;\s*\}\s*return\s+html\s*;\s*\}\s*\)\s*\.then\s*\(\s*html\s*=>\s*\{/;
// Pattern B: legacy direct fetch block
const fetchPattern = /fetch\s*\(\s*WIDGET_BASE\s*\+\s*"ui\.html"\s*\)\s*\.then\s*\(\s*res\s*=>\s*res\.text\s*\(\s*\)\s*\)\s*\.then\s*\(\s*html\s*=>\s*\{/;

if (placeholderBlock.test(widgetJs)) {
  widgetJs = widgetJs.replace(
    placeholderBlock,
    "Promise.resolve(" + inlined + ").then(html => {"
  );
} else if (fetchPattern.test(widgetJs)) {
  widgetJs = widgetJs.replace(
    fetchPattern,
    "Promise.resolve(" + inlined + ").then(html => {"
  );
} else {
  // Already inlined by prebuild/public pipeline
  if (widgetJs.includes("FUGAH CHATBOT WIDGET - HTML TEMPLATE")) {
    console.log("inline-ui-into-dist: ui already inlined in dist/widget.js");
    process.exit(0);
  }
  console.error("inline-ui-into-dist: Could not find inlinable ui block in widget.js");
  process.exit(1);
}

fs.writeFileSync(widgetPath, widgetJs);
console.log("inline-ui-into-dist: ui.html inlined into dist/widget.js (no fetch needed)");
