// eleventy.config.js
// Build config for PradyX portfolio.
// pathPrefix: GitHub Pages subpath — site deploys at /portfolio/
// Data pipeline: parses content/portfolio.md → _site/data/portfolio.json at build time.
// content/portfolio.md is source of truth — never modified by the build.

const path = require("path");
const fs = require("fs");

module.exports = function (eleventyConfig) {
  // GitHub Pages subpath
  eleventyConfig.pathPrefix = "/portfolio/";

  // Pass through static assets unchanged
  eleventyConfig.addPassthroughCopy("src/assets");

  // Nunjucks as default template engine
  eleventyConfig.setTemplateFormats("md,njk");

  // Jekyll-style filters replaced with native JS implementations (addJekyllFilters
  // was removed in Eleventy v3).
  eleventyConfig.addFilter("date", function (dateObj, format) {
    if (!dateObj) return "";
    if (dateObj === "now") {
      const d = new Date();
      if (!format) return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const map = { YYYY: d.getFullYear(), MM: String(d.getMonth() + 1).padStart(2, "0"), DD: String(d.getDate()).padStart(2, "0") };
      return format.replace(/YYYY|MM|DD/g, (tok) => String(map[tok] || tok));
    }
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return String(dateObj);
    if (!format) return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const map = { YYYY: d.getFullYear(), MM: String(d.getMonth() + 1).padStart(2, "0"), DD: String(d.getDate()).padStart(2, "0") };
    return format.replace(/YYYY|MM|DD/g, (tok) => String(map[tok] || tok));
  });
  eleventyConfig.addFilter("striptags", function (str) {
    if (!str) return "";
    return String(str).replace(/<[^>]*>/g, "");
  });
  eleventyConfig.addFilter("truncate", function (str, length) {
    if (!str) return "";
    const s = String(str);
    const n = parseInt(length, 10) || 30;
    if (s.length <= n) return s;
    return s.slice(0, n - 1) + "…";
  });

  // Markdown → HTML passthrough for .md templates
  eleventyConfig.addExtension("md", {
    outputDeprecated: true,
    result: "html",
  });

  // Generate portfolio.json from content/portfolio.md before build
  eleventyConfig.on("beforeBuild", () => {
    const src = path.join(__dirname, "content", "portfolio.md");
    const outDir = path.join(__dirname, "_site", "data");
    const outFile = path.join(outDir, "portfolio.json");

    if (!fs.existsSync(src)) {
      throw new Error(
        "content/portfolio.md not found — this file is the source of truth and must exist"
      );
    }

    const raw = fs.readFileSync(src, "utf8");
    const portfolio = parsePortfolioMD(raw);

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(portfolio, null, 2), "utf8");
    console.log("Generated _site/data/portfolio.json from content/portfolio.md");
  });

  // Generate CV PDF at build time (after portfolio.json exists)
  eleventyConfig.on("beforeBuild", () => {
    const buildPdf = require("./build-pdf");
    return buildPdf.generatePDF();
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
      layouts: "_includes/layouts",
    },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    passthroughCopies: {
      "src/assets/**": "assets/",
    },
  };
};

// ---------------------------------------------------------------------------
// Portfolio MD parser — matches the real structure of portfolio_content.md
// ---------------------------------------------------------------------------
// Format observed:
//   # Portfolio                          (title)
//   ## Overview                          (ignored)
//   ## Contact                           (bullet list: - **Label:** value / link)
//   ## Summary                           (plain paragraph)
//   ## Skills                            (inline **Category:** items per line)
//   ## Experience
//     ### Company Name                   (employer header)
//     **Role** | Duration                (bold role + pipe + duration)
//     - bullet points...
//   ## Education                         (bullet list: **Degree** — Institution, Years)
//   ## Projects
//     ### Project Name | Stats           (project header with stats)
//     description paragraph
//     [Label](url) links
//     - extra bullet points for multi-link entries
// ---------------------------------------------------------------------------

function parsePortfolioMD(md) {
  const lines = md.split("\n");
  const portfolio = {
    meta: { title: "Portfolio", lastUpdated: new Date().toISOString() },
    contact: {},
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
  };

  try {
    portfolio.meta.lastUpdated = new Date(
      fs.statSync(path.join(__dirname, "content", "portfolio.md")).mtime
    ).toISOString();
  } catch (_) {}

  let section = null;
  let currentExp = null;
  let currentProj = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, "").trim();
    if (!line || line.startsWith("<!--") || line.startsWith("# ")) continue;

    // Section headers (## )
    if (line.startsWith("## ")) {
      const title = line.slice(3).trim().toLowerCase();
      section = ({
        contact: "contact",
        overview: null,
        summary: "summary",
        skills: "skills",
        experience: "experience",
        education: "education",
        projects: "projects",
      })[title] || null;
      continue;
    }

    if (!section) continue;

    // ---- contact ----  - **Label:** value  or  - **Label:** [text](url)
    if (section === "contact") {
      // Parse: strip bullet, then split on ** to extract label and value.
      // Format is **Label:** value (colon INSIDE the closing **) so a regex
      // expecting **Label** : value won't match. Split on ** instead.
      let content = line;
      if (content.startsWith("- ")) content = content.slice(2);
      else if (content.startsWith("* ")) content = content.slice(2);
      const parts = content.split(/\*\*/);
      if (parts.length >= 3) {
        const rawLabel = parts[1].replace(/:$/, "").trim();
        const value = parts[2].trim();
        const label = rawLabel.toLowerCase().replace(/\s+/g, "");
        const linkMatch = value.match(/^\[(.+?)\]\((.+?)\)$/);
        if (linkMatch) {
          portfolio.contact[label] = { label: linkMatch[1], url: linkMatch[2] };
        } else {
          portfolio.contact[label] = { label, value };
        }
      }
      continue;
    }

    // ---- summary ----
    if (section === "summary") {
      portfolio.summary = portfolio.summary
        ? portfolio.summary + " " + line
        : line;
      continue;
    }

    // ---- skills ----  **Category:** item, item, ...  →  [{ name, skills }]
    if (section === "skills") {
      const m = line.match(/^\*\*(.+?):\*\*\s*(.+)/);
      if (m) {
        const cat = m[1].trim();
        const items = m[2].split(",").map((s) => s.trim()).filter(Boolean);
        portfolio.skills.push({ name: cat, skills: items });
      }
      continue;
    }

    // ---- experience ----
    if (section === "experience") {
      if (line.startsWith("### ") && !line.startsWith("#### ")) {
        // New company — flush previous if present
        if (currentExp) portfolio.experience.push(currentExp);
        currentExp = {
          role: "",
          company: line.slice(4).trim(),
          dates: "",
          description: [],
        };
        continue;
      }
      if (currentExp) {
        // **Role** | Duration → stored as `dates`
        if (/^\*\*/.test(line) && line.includes("|")) {
          const parts = line.split("|");
          currentExp.role = parts[0].replace(/\*\*/g, "").trim();
          currentExp.dates = parts
            .slice(1)
            .join("|")
            .replace(/\*\*/g, "")
            .trim();
          continue;
        }
        // - bullet
        if (line.startsWith("-")) {
          currentExp.description.push(line.slice(1).trim());
          continue;
        }
      }
      continue;
    }

    // ---- education ----  - **Degree** — Institution, Years
    if (section === "education") {
      let content = line;
      if (content.startsWith("- ")) content = content.slice(2);
      else if (content.startsWith("* ")) content = content.slice(2);
      const m = content.match(/^\*\*(.+?)\*\*\s*[-–—]\s*(.+)/);
      if (m) {
        const degree = m[1].trim();
        const rest = m[2].trim();
        // Extract year range (e.g. 2020–2022) or single year
        const yearMatch = rest.match(/\b(\d{4})\s*[-–—]\s*(\d{4})\b/);
        let institution = rest;
        let year = "";
        if (yearMatch) {
          const yr = yearMatch[0];
          institution = rest
            .slice(0, rest.indexOf(yr))
            .trim()
            .replace(/,?\s*$/, "");
          year = yearMatch[1] + "-" + yearMatch[2];
        } else {
          const single = rest.match(/\b(\d{4})\b/);
          if (single) {
            institution = rest
              .slice(0, single.index)
              .trim()
              .replace(/,?\s*$/, "");
            year = single[1];
          }
        }
        portfolio.education.push({ degree, institution, dates: year, provider: "" });
      }
      continue;
    }

    // ---- projects ----
    if (section === "projects") {
      if (line.startsWith("### ") && !line.startsWith("#### ")) {
        if (currentProj) portfolio.projects.push(currentProj);
        const header = line.slice(4).trim();
        const pipeIdx = header.indexOf("|");
        currentProj = {
          name: pipeIdx > 0 ? header.slice(0, pipeIdx).trim() : header,
          stats: pipeIdx > 0 ? header.slice(pipeIdx + 1).trim() : "",
          description: "",
          links: {},
          features: [],
        };
        continue;
      }
      if (currentProj) {
        if (/^\[/.test(line)) {
          const m = line.match(/^\[(.+?)\]\((.+?)\)/);
          if (m) currentProj.links[m[1].toLowerCase()] = m[2];
        } else if (line.startsWith("-")) {
          currentProj.features.push(line.slice(1).trim());
        } else if (line && !currentProj.description) {
          currentProj.description = line;
        } else if (line && currentProj.description) {
          currentProj.description += " " + line;
        }
      }
      continue;
    }
  }

  // Flush pending entries
  if (currentExp) portfolio.experience.push(currentExp);
  if (currentProj) {
    // Primary URL: prefer an explicit "source" link, fall back to first available link
    currentProj.url = currentProj.links?.source || Object.values(currentProj.links || {})[0] || "";
    portfolio.projects.push(currentProj);
  }

  return portfolio;
}
