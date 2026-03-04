const fs = require("fs");
const path = require("path");

const testDir = path.join(__dirname, "..", "test");
const publicDir = path.join(testDir, "public");

fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(path.join(testDir, "widget.js"), path.join(publicDir, "widget.js"));
fs.copyFileSync(path.join(testDir, "widget.css"), path.join(publicDir, "widget.css"));
fs.copyFileSync(path.join(testDir, "ui.html"), path.join(publicDir, "ui.html"));
fs.cpSync(path.join(testDir, "assets"), path.join(publicDir, "assets"), { recursive: true });

console.log("Widget files copied to test/public for Vite build.");
