// build-pdf.js
// Generates _site/assets/pradyx-cv.pdf from _site/data/portfolio.json at build time.
// Runs as a second beforeBuild hook in eleventy.config.js (after portfolio.json is written).
// Self-contained: pure Node + pdfkit, no external network/calls, no new system deps.

const fs = require("fs");
const path = require("path");
let PDFDocument = null;
try {
  PDFDocument = require("pdfkit");
} catch (_) {
  // pdfkit not installed — PDF generation is optional; HTML build continues without it.
}

const ROOT = __dirname;
const PORTFOLIO_JSON = path.join(ROOT, "_site", "data", "portfolio.json");
const OUTPUT_DIR = path.join(ROOT, "_site", "assets");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "pradyx-cv.pdf");

// ---------------------------------------------------------------------------
// Load portfolio data — prefer the build-generated JSON, fall back to parsing
// content/portfolio.md directly (mirrors the _data/portfolio.js fallback path).
// ---------------------------------------------------------------------------

function loadPortfolio() {
  if (fs.existsSync(PORTFOLIO_JSON)) {
    try {
      return JSON.parse(fs.readFileSync(PORTFOLIO_JSON, "utf8"));
    } catch (err) {
      console.warn(
        "build-pdf: could not parse portfolio.json, falling back to MD:",
        err.message
      );
    }
  }
  // Fallback: parse MD directly (lightweight inline copy of parsePortfolioMD
  // so build-pdf.js has no runtime dependency on _data/portfolio.js).
  const mdPath = path.join(ROOT, "content", "portfolio.md");
  if (!fs.existsSync(mdPath)) {
    throw new Error(
      "content/portfolio.md not found — source of truth must exist for PDF build"
    );
  }
  return parsePortfolioMD(fs.readFileSync(mdPath, "utf8"));
}

// ---------------------------------------------------------------------------
// Minimal MD parser (matches content/portfolio.md structure).
// Kept in sync with _data/portfolio.js / eleventy.config.js parsers.
// ---------------------------------------------------------------------------

function parsePortfolioMD(md) {
  const lines = md.split("\n");
  const portfolio = {
    meta: { name: "Pradyumn Bhushan", tagline: "Android Application Developer" },
    contact: {},
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
  };

  let section = null;
  let currentExp = null;
  let currentProj = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, "").trim();
    if (!line || line.startsWith("<!--") || line.startsWith("# ")) continue;

    if (line.startsWith("## ")) {
      const title = line.slice(3).trim().toLowerCase();
      section = {
        contact: "contact",
        overview: null,
        summary: "summary",
        skills: "skills",
        experience: "experience",
        education: "education",
        projects: "projects",
      }[title] || null;
      continue;
    }
    if (!section) continue;

    if (section === "contact") {
      let content = line;
      if (content.startsWith("- ")) content = content.slice(2);
      else if (content.startsWith("* ")) content = content.slice(2);
      const parts = content.split(/\*\*/);
      if (parts.length >= 3) {
        const rawLabel = parts[1].replace(/:$/, "").trim();
        const value = parts[2].trim();
        const linkMatch = value.match(/^\[(.+?)\]\((.+?)\)$/);
        if (linkMatch) {
          portfolio.contact[rawLabel.toLowerCase().replace(/\s+/g, "")] = {
            label: linkMatch[1],
            url: linkMatch[2],
          };
        } else {
          portfolio.contact[rawLabel.toLowerCase().replace(/\s+/g, "")] = {
            label: rawLabel,
            value,
          };
        }
      }
      continue;
    }

    if (section === "summary") {
      portfolio.summary = portfolio.summary
        ? portfolio.summary + " " + line
        : line;
      continue;
    }

    if (section === "skills") {
      const m = line.match(/^\*\*(.+?):\*\*\s*(.+)/);
      if (m) {
        portfolio.skills.push({ name: m[1].trim(), skills: m[2].split(",").map((s) => s.trim()).filter(Boolean) });
      }
      continue;
    }

    if (section === "experience") {
      if (line.startsWith("### ") && !line.startsWith("#### ")) {
        if (currentExp) portfolio.experience.push(currentExp);
        currentExp = { role: "", company: line.slice(4).trim(), dates: "", description: [] };
        continue;
      }
      if (currentExp) {
        if (/\*\*/.test(line) && line.includes("|")) {
          const parts = line.split("|");
          currentExp.role = parts[0].replace(/\*\*/g, "").trim();
          currentExp.dates = parts.slice(1).join("|").replace(/\*\*/g, "").trim();
          continue;
        }
        if (line.startsWith("-")) {
          currentExp.description.push(line.slice(1).trim());
          continue;
        }
      }
      continue;
    }

    if (section === "education") {
      let content = line;
      if (content.startsWith("- ")) content = content.slice(2);
      else if (content.startsWith("* ")) content = content.slice(2);
      const m = content.match(/^\*\*(.+?)\*\*\s*[-–—]\s*(.+)/);
      if (m) {
        const rest = m[2].trim();
        const yearMatch = rest.match(/\b(\d{4})\s*[-–—]\s*(\d{4})\b/);
        portfolio.education.push({
          degree: m[1].trim(),
          institution: yearMatch
            ? rest.slice(0, rest.indexOf(yearMatch[0])).trim().replace(/,?\s*$/, "")
            : rest.replace(/\s*,\s*\d{4}.*$/, "").trim(),
          dates: yearMatch ? `${yearMatch[1]}–${yearMatch[2]}` : "",
        });
      }
      continue;
    }

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

  if (currentExp) portfolio.experience.push(currentExp);
  if (currentProj) {
    currentProj.url = currentProj.links?.source || Object.values(currentProj.links || {})[0] || "";
    portfolio.projects.push(currentProj);
  }
  return portfolio;
}

// ---------------------------------------------------------------------------
// PDF layout helpers
// ---------------------------------------------------------------------------

const PAGE_W = 612; // Letter width in points
const PAGE_H = 792;
const MARGIN = 72;
const CONTENT_W = PAGE_W - 2 * MARGIN;

function setupPage(doc) {
  doc.page.width = PAGE_W;
  doc.page.height = PAGE_H;
}

function ensureSpace(doc, needed) {
  if (doc.y + needed > PAGE_H - MARGIN) {
    doc.addPage();
    doc.y = MARGIN;
  }
}

function sectionTitle(doc, text) {
  ensureSpace(doc, 30);
  doc.y += 8;
  doc.font("Helvetica-Bold");
  doc.fontSize(13);
  doc.text(text.toUpperCase(), MARGIN, doc.y);
  doc.y += 16;
  doc.font("Helvetica");
  doc.lineWidth(0.75);
  doc.strokeColor(200, 200, 200);
  doc.moveTo(MARGIN, doc.y);
  doc.lineTo(MARGIN + CONTENT_W, doc.y);
  doc.stroke();
  doc.strokeColor(0, 0, 0);
  doc.y += 6;
}

function body(doc, text, opts = {}) {
  ensureSpace(doc, 16);
  doc.font("Helvetica");
  doc.fontSize(opts.size || 10);
  doc.text(text, MARGIN, doc.y, { width: CONTENT_W, ...opts });
  doc.y += (opts.size || 10) * 1.35;
}

function bullet(doc, text) {
  ensureSpace(doc, 14);
  doc.font("Helvetica");
  doc.fontSize(10);
  doc.text("\u2022", MARGIN, doc.y, { continued: true });
  doc.text(text, MARGIN + 12, doc.y, { width: CONTENT_W - 12 });
  doc.y += 12.5;
}

function subhead(doc, text) {
  ensureSpace(doc, 16);
  doc.font("Helvetica-Bold");
  doc.fontSize(10);
  doc.text(text, MARGIN, doc.y);
  doc.y += 12;
}

// ---------------------------------------------------------------------------
// Build the PDF
// ---------------------------------------------------------------------------

function buildPDF(portfolio) {
  const doc = new PDFDocument({
    size: [PAGE_W, PAGE_H],
    info: {
      Title: "PradyX — Curriculum Vitae",
      Author: portfolio.meta.name || "Pradyumn Bhushan",
      Subject: "CV — Android Application Developer",
    },
  });

  setupPage(doc);
  doc.y = MARGIN;

  // ---- Header block ----
  ensureSpace(doc, 90);
  doc.font("Helvetica-Bold");
  doc.fontSize(22);
  doc.text(portfolio.meta.name || "Pradyumn Bhushan", MARGIN, doc.y);
  doc.y += 26;

  doc.font("Helvetica");
  doc.fontSize(11);
  doc.text(portfolio.meta.tagline || "Android Application Developer", MARGIN, doc.y);
  doc.y += 14;

  // Contact line: Phone · Email · GitHub · LinkedIn · Website
  const contactParts = [];
  const contactSrc = portfolio.contact;
  if (contactSrc) {
    const entries = Array.isArray(contactSrc)
      ? contactSrc
      : Object.entries(contactSrc).map(([k, v]) => ({ type: k, ...v }));
    for (const c of entries) {
      if (c.type === "phone" && c.value) contactParts.push(c.value);
      else if (c.type === "email" && c.value) contactParts.push(c.value);
      else if (c.type === "link" && c.label) contactParts.push(c.label);
    }
  }
  if (contactParts.length) {
    doc.fontSize(9);
    doc.fillColor(90, 90, 90);
    doc.text(contactParts.join("   ·   "), MARGIN, doc.y);
    doc.fillColor(0, 0, 0);
    doc.y += 12;
  }

  // Divider
  doc.lineWidth(1.5);
  doc.strokeColor(29, 78, 216);
  doc.moveTo(MARGIN, doc.y);
  doc.lineTo(MARGIN + CONTENT_W, doc.y);
  doc.stroke();
  doc.strokeColor(0, 0, 0);
  doc.y += 12;

  // ---- Summary ----
  if (portfolio.summary) {
    sectionTitle(doc, "Professional Summary");
    body(doc, portfolio.summary);
    doc.y += 4;
  }

  // ---- Skills ----
  if (portfolio.skills && portfolio.skills.length) {
    sectionTitle(doc, "Technical Skills");
    for (const cat of portfolio.skills) {
      subhead(doc, cat.name);
      if (cat.skills && cat.skills.length) {
        // Layout skill items two per line where they fit
        const items = cat.skills;
        let line = "";
        for (let i = 0; i < items.length; i++) {
          const candidate = line ? line + ", " + items[i] : items[i];
          if (doc.widthOfString(candidate) > CONTENT_W && line) {
            body(doc, line);
            line = items[i];
          } else {
            line = candidate;
          }
        }
        if (line) body(doc, line);
      }
      doc.y += 3;
    }
    doc.y += 2;
  }

  // ---- Experience ----
  if (portfolio.experience && portfolio.experience.length) {
    sectionTitle(doc, "Professional Experience");
    for (const exp of portfolio.experience) {
      ensureSpace(doc, 50);
      subhead(doc, exp.company || "");
      if (exp.role || exp.dates) {
        const roleLine = [exp.role, exp.dates].filter(Boolean).join("   |   ");
        doc.font("Helvetica-Oblique");
        doc.fontSize(9.5);
        doc.text(roleLine, MARGIN, doc.y);
        doc.y += 12;
        doc.font("Helvetica");
      }
      if (exp.description && exp.description.length) {
        for (const b of exp.description) bullet(doc, b);
      }
      doc.y += 4;
    }
    doc.y += 2;
  }

  // ---- Education ----
  if (portfolio.education && portfolio.education.length) {
    sectionTitle(doc, "Education");
    for (const edu of portfolio.education) {
      ensureSpace(doc, 20);
      const eduLine = edu.degree;
      subhead(doc, eduLine);
      const instLine = [edu.institution, edu.dates].filter(Boolean).join("   ·   ");
      if (instLine) body(doc, instLine);
      doc.y += 2;
    }
    doc.y += 2;
  }

  // ---- Projects ----
  if (portfolio.projects && portfolio.projects.length) {
    sectionTitle(doc, "Selected Projects");
    for (const proj of portfolio.projects) {
      ensureSpace(doc, 34);
      subhead(doc, proj.name);
      if (proj.stats) {
        doc.font("Helvetica-Oblique");
        doc.fontSize(9);
        doc.text(proj.stats, MARGIN, doc.y);
        doc.y += 11;
        doc.font("Helvetica");
      }
      if (proj.description) {
        body(doc, proj.description, { size: 9.5 });
      }
      // Links
      const linkEntries = Object.entries(proj.links || {});
      if (linkEntries.length) {
        for (const [label, url] of linkEntries) {
          bullet(doc, `${label}: ${url}`);
        }
      }
      doc.y += 3;
    }
  }

  // ---- Footer on every page ----
  doc.on("pageAdded", () => {
    const y = PAGE_H - 40;
    doc.font("Helvetica");
    doc.fontSize(8);
    doc.fillColor(150, 150, 150);
    doc.text(
      "PradyX — Curriculum Vitae   ·   https://pradyx.github.io/portfolio/   ·   Generated " +
        new Date().toISOString().slice(0, 10),
      MARGIN,
      y
    );
    doc.fillColor(0, 0, 0);
  });

  return doc;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function generatePDF() {
  if (!PDFDocument) {
    console.log("CV PDF skipped: pdfkit not installed (install it to enable PDF generation)");
    return Promise.resolve();
  }

  const portfolio = loadPortfolio();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const doc = buildPDF(portfolio);
  const stream = fs.createWriteStream(OUTPUT_FILE);
  doc.pipe(stream);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      const size = fs.statSync(OUTPUT_FILE).size;
      console.log(`CV PDF generated: ${OUTPUT_FILE} (${(size / 1024).toFixed(1)} KB)`);
      resolve();
    });
    stream.on("error", reject);
  });
}

// When run directly (not imported): generate and exit.
if (require.main === module) {
  generatePDF()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("CV PDF build failed:", err);
      process.exit(1);
    });
}

module.exports = { generatePDF, loadPortfolio, parsePortfolioMD };
