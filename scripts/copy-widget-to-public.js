const fs = require("fs");
const path = require("path");

const testDir = path.join(__dirname, "..", "test");
const publicDir = path.join(testDir, "public");

fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(path.join(testDir, "widget.js"), path.join(publicDir, "widget.js"));
fs.copyFileSync(path.join(testDir, "widget.css"), path.join(publicDir, "widget.css"));
fs.copyFileSync(path.join(testDir, "ui.html"), path.join(publicDir, "ui.html"));
fs.cpSync(path.join(testDir, "assets"), path.join(publicDir, "assets"), { recursive: true });

// Inline ui.html into widget.js so the widget doesn't need a second request (avoids ERR_CONNECTION_RESET on Salla)
const uiHtml = fs.readFileSync(path.join(testDir, "ui.html"), "utf8");
const inlined = JSON.stringify(uiHtml);
let widgetJs = fs.readFileSync(path.join(publicDir, "widget.js"), "utf8");
const fetchPattern = /fetch\s*\(\s*WIDGET_BASE\s*\?\s*WIDGET_BASE\s*\+\s*"ui\.html"\s*:\s*"ui\.html"\s*\)\s*\/\/ Load HTML template\s*\.then\s*\(\s*res\s*=>\s*res\.text\s*\(\s*\)\s*\)\s*\.then\s*\(\s*html\s*=>\s*\{/;
if (!fetchPattern.test(widgetJs)) {
  throw new Error("copy-widget-to-public: could not find fetch block in widget.js");
}
widgetJs = widgetJs.replace(fetchPattern, "Promise.resolve(" + inlined + ").then(html => {");
fs.writeFileSync(path.join(publicDir, "widget.js"), widgetJs);

console.log("Widget files copied to test/public (ui.html inlined into widget.js).");
