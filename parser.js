// ---------------------------------------------------------------------------
// Portfolio MD parser — parses content/portfolio.md into structured JSON.
// Format (exact):
//   # Portfolio
//   ## Contact
//     - **Phone:** +91-7080968720
//     - **Email:** pradyumnbhushan@gmail.com
//     - **GitHub:** [PradyX](https://github.com/PradyX)
//     - **LinkedIn:** [Profile](https://linkedin.com/in/pradyumnbhushan)
//     - **Website:** [pradyx.github.io](https://pradyx.github.io)
//   ## Summary
//     paragraph text...
//   ## Skills
//     **Core:** a, b, c
//     **Architecture & Patterns:** a, b
//     ... (9 categories)
//   ## Experience
//     ### Company Name
//     **Role** | Duration
//     - bullet
//   ## Education
//     - **Degree** — Institution, Years
//   ## Projects
//     ### Name | Stats
//     description
//     [Label](url)
//     - feature bullets
// ---------------------------------------------------------------------------

function parsePortfolioMD(md) {
  const lines = md.split("\n");
  const portfolio = {
    meta: { title: "Portfolio", lastUpdated: new Date().toISOString() },
    contact: {},
    summary: "",
    skills: {
      core: [],
      "architecture & patterns": [],
      networking: [],
      media: [],
      "platform & tools": [],
      firebase: [],
      "ads & analytics": [],
      "ai/llms": [],
      aosp: [],
    },
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
      const m = line.match(/^[-*]\s*\*\*(.+?)\*\*\s*[:：]\s*(.+)/);
      if (m) {
        const label = m[1].trim().toLowerCase().replace(/\s+/g, "");
        let value = m[2].trim();
        const link = value.match(/\[(.+?)\]\((.+?)\)/);
        if (link) {
          portfolio.contact[label] = { label: link[1], url: link[2] };
        } else {
          portfolio.contact[label] = { label, value };
        }
      }
      continue;
    }

    // ---- summary ----
    if (section === "summary") {
      portfolio.summary = portfolio.summary ? portfolio.summary + " " + line : line;
      continue;
    }

    // ---- skills ----  **Category:** item, item, ...
    if (section === "skills") {
      const m = line.match(/^\*\*(.+?):\*\*\s*(.+)/);
      if (m) {
        const cat = m[1].trim().toLowerCase();
        const items = m[2].split(",").map((s) => s.trim()).filter(Boolean);
        if (portfolio.skills[cat]) portfolio.skills[cat].push(...items);
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
          duration: "",
          description: [],
        };
        continue;
      }
      if (currentExp) {
        // **Role** | Duration
        if (/^\*\*/.test(line) && line.includes("|")) {
          const parts = line.split("|");
          currentExp.role = parts[0].replace(/\*\*/g, "").trim();
          currentExp.duration = parts.slice(1).join("|").replace(/\*\*/g, "").trim();
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
      const m = line.match(/^[-*]\s*\*\*(.+?)\*\*\s*[-–—]\s*(.+)/);
      if (m) {
        const rest = m[2].trim();
        const yearMatch = rest.match(/\b(\d{4})\s*[-–—]\s*(\d{4})\b/);
        portfolio.education.push({
          degree: m[1].trim(),
          institution: yearMatch
            ? rest.slice(0, rest.indexOf(yearMatch[0])).trim()
            : rest.replace(/\s*,\s*\d{4}.*$/, "").trim(),
          year: yearMatch ? `${yearMatch[1]}–${yearMatch[2]}` : "",
          provider: "",
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
          const m = line.match(/\[(.+?)\]\((.+?)\)/);
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
  if (currentProj) portfolio.projects.push(currentProj);

  return portfolio;
}
