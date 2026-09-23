const { execSync } = require("child_process");
try {
  execSync("npm install --ignore-scripts pdfkit", { cwd: "/Users/prady/Projects/portfolio", stdio: "inherit" });
  console.log("Install succeeded");
} catch (e) {
  console.error("Install failed:", e.message);
  process.exit(1);
}
