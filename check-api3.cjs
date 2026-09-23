// Create a mock config callback to capture the API object
const eleventy = require("@11ty/eleventy");
const captured = [];
eleventy((api) => {
  captured.push(api);
  // Don't actually build
  return { dir: { input: "_dummy" } };
});
console.log("API keys:", Object.keys(captured[0]).filter(k => k.toLowerCase().includes("passthrough")));
console.log("All API keys:", Object.keys(captured[0]).slice(0, 30));
