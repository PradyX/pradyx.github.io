// Simulate what eleventy does internally — create a config API object
const plugin = require("@11ty/eleventy");
// The module exports a function that when called returns the plugin
// Let's check its exports
console.log("Module type:", typeof plugin);
console.log("Module keys:", Object.keys(plugin).slice(0, 20));

// Try to find passthrough-related methods
const allKeys = [];
function collectKeys(obj, depth = 0) {
  if (depth > 3) return;
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (k.toLowerCase().includes("passthrough")) {
        allKeys.push(k);
      }
      if (depth < 2 && typeof v === "object" && v !== null) {
        collectKeys(v, depth + 1);
      }
    }
  }
}
collectKeys(plugin);
console.log("Passthrough keys:", allKeys);
