const fs = require("fs");
const path = require("path");

const testDir = path.join(__dirname, "..", "test");
const publicDir = path.join(testDir, "public");

fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(path.join(testDir, "widget.js"), path.join(publicDir, "widget.js"));
fs.copyFileSync(path.join(testDir, "widget.css"), path.join(publicDir, "widget.css"));
fs.copyFileSync(path.join(testDir, "ui.html"), path.join(publicDir, "ui.html"));
fs.cpSync(path.join(testDir, "assets"), path.join(publicDir, "assets"), { recursive: true });

// Inline ui.html into widget.js so the widget doesn't need a second request (snippet/CDN: no ui.html fetch)
const uiHtml = fs.readFileSync(path.join(testDir, "ui.html"), "utf8");
const inlined = JSON.stringify(uiHtml);
let widgetJs = fs.readFileSync(path.join(publicDir, "widget.js"), "utf8");
// Replace placeholder + dev fallback with just the inlined HTML (single-file snippet)
const placeholderBlock = /Promise\.resolve\s*\(\s*"__UI_HTML_INLINED__"\s*\)\s*\.then\s*\(\s*html\s*=>\s*\{\s*if\s*\(\s*html\s*===\s*"__UI_HTML_INLINED__"\s*\)\s*\{\s*return\s+fetch\s*\([^)]+\)\.then\s*\(\s*r\s*=>\s*r\.text\s*\(\s*\)\s*\)\s*;\s*\}\s*return\s+html\s*;\s*\}\s*\)\s*\.then\s*\(\s*html\s*=>\s*\{/;
if (!placeholderBlock.test(widgetJs)) {
  throw new Error("copy-widget-to-public: could not find __UI_HTML_INLINED__ block in widget.js");
}
widgetJs = widgetJs.replace(placeholderBlock, "Promise.resolve(" + inlined + ").then(html => {");
widgetJs = "// Fugah widget snippet build (ui inlined, no ui.html fetch)\n" + widgetJs;
fs.writeFileSync(path.join(publicDir, "widget.js"), widgetJs);

console.log("Widget files copied to test/public (ui.html inlined into widget.js).");
//hello nia7a