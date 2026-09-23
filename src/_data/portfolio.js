// src/_data/portfolio.js
// Loads _site/data/portfolio.json (generated at build time by eleventy.config.js).
// Falls back to parsing content/portfolio.md directly when the JSON does not yet
// exist (e.g. first `eleventy --serve` startup before the beforeBuild hook runs).
//
// This data cascades to all templates as `portfolio`.

const fs = require("fs");
const path = require("path");

const portfolioJSONPath = path.join(__dirname, "..", "..", "_site", "data", "portfolio.json");
const contentMDPath = path.join(__dirname, "..", "..", "content", "portfolio.md");

// ---------------------------------------------------------------------------
// parsePortfolioMD — shared parser; also used by eleventy.config.js beforeBuild
// ---------------------------------------------------------------------------
function parsePortfolioMD(md) {
  const lines = md.split("\n");
  const portfolio = {
    meta: {
      name: "Pradyumn Bhushan",
      url: "https://pradyx.github.io/portfolio/",
      tagline: "Android Application Developer",
      title: "PradyX - Portfolio",
      lastUpdated: new Date().toISOString(),
    },
    contact: {},
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
  };

  try {
    portfolio.meta.lastUpdated = new Date(
      fs.statSync(contentMDPath).mtime
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
        portfolio.education.push({
          degree,
          institution,
          dates: year,
          institution_url: "",
        });
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
    // Derive a primary URL: explicit "source" link preferred, then first available link, then placeholder
    currentProj.url =
      currentProj.links?.source ||
      Object.values(currentProj.links || {})[0] ||
      "#";
    portfolio.projects.push(currentProj);
  }

  return portfolio;
}

// ---------------------------------------------------------------------------
// Load portfolio data
// ---------------------------------------------------------------------------
let portfolio = {};
if (fs.existsSync(portfolioJSONPath)) {
  try {
    portfolio = JSON.parse(fs.readFileSync(portfolioJSONPath, "utf8"));
  } catch (err) {
    console.warn(
      "Warning: could not parse _site/data/portfolio.json, falling back to MD:",
      err.message
    );
    portfolio = parsePortfolioMD(fs.readFileSync(contentMDPath, "utf8"));
  }
} else {
  // JSON not yet generated (first build / serve startup) — parse MD directly
  if (fs.existsSync(contentMDPath)) {
    portfolio = parsePortfolioMD(fs.readFileSync(contentMDPath, "utf8"));
  }
}

// ---------------------------------------------------------------------------
// Derived fields for templates / JSON-LD
// ---------------------------------------------------------------------------

// Derive primary URL for projects that lack it (e.g. JSON written by an older parser)
if (Array.isArray(portfolio.projects)) {
  for (const proj of portfolio.projects) {
    if (!proj.url || proj.url === "") {
      proj.url =
        proj.links?.source ||
        Object.values(proj.links || {})[0] ||
        "#";
    }
  }
}

// contact: object → array of { type, label, value }
const contactSrc = portfolio.contact;
let contactArray = contactSrc;
if (contactSrc && typeof contactSrc === "object" && !Array.isArray(contactSrc)) {
  contactArray = Object.entries(contactSrc).map(([key, item]) => {
    const isLink = !!(item && item.url);
    return {
      type: isLink ? "link" : key,
      label: (item && item.label) || key,
      value: (item && item.url) || (item && item.value) || key,
    };
  });
}

const telephone =
  contactSrc && contactSrc.phone && typeof contactSrc.phone.value === "string"
    ? contactSrc.phone.value
    : "";

const emailAddr =
  contactSrc && contactSrc.email && typeof contactSrc.email.value === "string"
    ? contactSrc.email.value
    : "";

const sameAs = contactArray
  .filter(
    (c) => c.type === "link" && typeof c.value === "string" && c.value.startsWith("http")
  )
  .map((c) => c.value);

module.exports = Object.assign({}, portfolio, {
  contact: contactArray,
  telephone,
  email: emailAddr,
  sameAs,
});
