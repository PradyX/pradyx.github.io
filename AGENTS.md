# Portfolio project instructions

## Source of truth

- `files/resume.pdf` is the only source of truth for Pradyumn Bhushan's personal and professional information. Read all three pages and extract PDF link annotations before updating content.
- Source contact details, profile text, job titles, employers, dates, contributions, education, skills, new projects, download counts, and links from that PDF.
- Do not use `files/old_resume.pdf`, online profiles, previous generated content, or assumptions as evidence for new claims.
- The user authorized fetching project artwork from the resume's Play Store listings and linked public repositories. Use those sources for logos/screenshots only; resume text remains the authority for descriptions, roles, dates, and counts. Record asset provenance in `images/portfolio/sources.json`.
- Do not invent achievements, proficiency percentages, technologies, metrics, dates, current employment, location, or work availability. Omit unsupported optional information.
- Keep experience and download counts as stated in the resume; do not extrapolate them to today's date.
- Do not modify either resume PDF as part of a website content update.
- `files/cv.pdf` is a derived, publicly downloadable CV created only from `files/resume.pdf`. It is not a second source of truth. Recreate and visually verify it when the source resume changes, retaining the supplied dates, contributions, skills, projects, and links without inventing claims. Keep the source PDF unchanged.

## Contact privacy

- The user explicitly requested that the phone number remain only in the resume. Never display it on the website or include it in HTML, `tel:` links, metadata, structured data, or scripts.
- Use Gmail/email and LinkedIn icon links instead of visibly printing the email address or profile URL. The email address can remain in the `mailto:` destination so the icon works.
- Keep icon links accessible with descriptive labels, adequate click targets, and visible keyboard focus. Apply the same contact style consistently in About and Contact.
- Do not add other personal contact details just because they appear in the resume. User privacy preferences override which resume facts are published.
- Omit the phone number from the generated public CV as well. Use labeled professional contact links instead of visibly printing personal contact details.

## Preserve existing projects

- Keep every pre-existing project entry in `index.html` unchanged: markup, captions, links, images, categories, order, and visibility.
- Preserve commented project entries too; do not activate, remove, or rewrite them without an explicit user request.
- Add missing resume projects to the same original portfolio gallery, after its existing entries. Match its image tiles, preview/link controls, and filter classes. Keep descriptions and download counts in the image preview captions; preserve all supplied project links.
- A resume summary of Xiaomi SDM660 platform development can link to its existing kernel alongside the additional device tree and newer XDA release; keep the original ROM/kernel tiles intact.

## GitHub Pages architecture

- This is a static user website for `https://pradyx.github.io/`.
- The entry point is the repository-root `index.html`; styles are in `css/`, scripts in `js/`, images in `images/`, and the downloadable resume in `files/resume.pdf`.
- Keep the Download CV button next to Download Resume in About. Both documents are static PDF assets; the buttons may wrap on narrow screens.
- Use static HTML, CSS, assets, and browser-side JavaScript supported by GitHub Pages. Keep new content in HTML so it remains accessible without JavaScript.
- Retain the current design and dependencies. Do not introduce a framework, server-side runtime, API server, database, package manager, or build requirement for a routine content update.
- Python is used only to preview static files locally. No Python process runs on GitHub Pages.
- Use relative asset paths and ordinary HTTPS and `mailto:` links. Give new external links `rel="noopener noreferrer"` when opening a new tab.
- Preserve unrelated checkout changes. Do not reset or discard the user's work.

## Project documentation

- Keep the Obsidian project map in `/Users/prady/Vault/Projects/pradyx.github.io/Project Map.md`.
- Maintain linked notes for resume provenance and local testing when the structure or workflow changes.
- The vault is project documentation; it is not a second source of biographical facts. Keep it outside the published website.

## Verification and preview

- Check that the original project entries and comments are byte-for-byte unchanged and new project links match PDF annotations. New tiles can be appended within the gallery.
- Verify the resume is unchanged, the website has no phone number or `tel:` link, email/LinkedIn icon destinations match the PDF, all local assets resolve, and employment/education dates are correct.
- Check desktop and mobile rendering, navigation, new project links, and the resume download. Check modified JavaScript syntax and `git diff --check`.
- Start local testing with `./start.sh 8000`, leave it running, open the preview, and report the actual URL. If that port is occupied, choose an available port and tell the user.
- Do not publish, push, or deploy just because the user asks to test locally.
