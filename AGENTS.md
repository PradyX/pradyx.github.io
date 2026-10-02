# Portfolio project instructions

## Source of truth

- `files/resume.pdf` is the only source of truth for Pradyumn Bhushan's personal and professional information. Read all three pages and extract PDF link annotations before updating content.
- Source contact details, profile text, job titles, employers, dates, contributions, education, skills, new projects, download counts, and links from that PDF.
- Do not use `files/old_resume.pdf`, online profiles, previous generated content, or assumptions as evidence for new claims.
- Do not invent achievements, proficiency percentages, technologies, metrics, dates, current employment, location, or work availability. Omit unsupported optional information.
- Keep experience and download counts as stated in the resume; do not extrapolate them to today's date.
- Do not modify either resume PDF as part of a website content update.

## Preserve existing projects

- Keep every pre-existing project entry in `index.html` unchanged: markup, captions, links, images, categories, order, and visibility.
- Preserve commented project entries too; do not activate, remove, or rewrite them without an explicit user request.
- Add missing resume projects after the original portfolio gallery. New summaries may include resume-backed app descriptions, download counts, Play Store URLs, repository links, XDA links, device trees, and kernels.
- A resume summary of Xiaomi SDM660 platform development can link to its existing kernel alongside the additional device tree and newer XDA release; keep the original ROM/kernel tiles intact.

## GitHub Pages architecture

- This is a static user website for `https://pradyx.github.io/`.
- The entry point is the repository-root `index.html`; styles are in `css/`, scripts in `js/`, images in `images/`, and the downloadable resume in `files/resume.pdf`.
- Use static HTML, CSS, assets, and browser-side JavaScript supported by GitHub Pages. Keep new content in HTML so it remains accessible without JavaScript.
- Retain the current design and dependencies. Do not introduce a framework, server-side runtime, API server, database, package manager, or build requirement for a routine content update.
- Python is used only to preview static files locally. No Python process runs on GitHub Pages.
- Use relative asset paths and ordinary HTTPS, `mailto:`, and `tel:` links. Give new external links `rel="noopener noreferrer"` when opening a new tab.
- Preserve unrelated checkout changes. Do not reset or discard the user's work.

## Project documentation

- Keep the Obsidian project map in `/Users/prady/Vault/Projects/pradyx.github.io/Project Map.md`.
- Maintain linked notes for resume provenance and local testing when the structure or workflow changes.
- The vault is project documentation; it is not a second source of biographical facts. Keep it outside the published website.

## Verification and preview

- Check that the original portfolio gallery is byte-for-byte unchanged and new project links match PDF annotations.
- Verify the resume is unchanged, all local asset paths resolve, contact links match the PDF, and employment/education dates are correct.
- Check desktop and mobile rendering, navigation, new project links, and the resume download. Check modified JavaScript syntax and `git diff --check`.
- Start local testing with `./start.sh 8000`, leave it running, open the preview, and report the actual URL. If that port is occupied, choose an available port and tell the user.
- Do not publish, push, or deploy just because the user asks to test locally.
