# nicolagrillo1984/personalsite

Personal site of Nicola Grillo. Live at
`https://nicolagrillo1984.github.io/personalsite/` via GitHub Pages (project
site on the default domain — no custom domain is owned, never reference
`nicolagrillo.dev` anywhere).

## Agents & the publish pipeline

`.claude/agents/` defines 9 specialized roles: architect, content-writer,
ai-data-expert, site-developer, qa-tester, analytics-analyst, marketing,
compliance, security — each file documents its own scope and what it hands
off to whom. Default autonomy level across all of them: **propose, then the
user approves** — no agent commits/pushes or publishes content on its own
judgment call.

Publishing a new blog article is never a single agent's job — it's
orchestrated. `.claude/skills/publish-article/SKILL.md` is that
orchestration: content-writer drafts → ai-data-expert reviews → user
approval gate → qa-tester verifies → compliance checks → (site-developer
and security only if the article needed actual code changes) → a second
user approval gate before `git push`. Use that skill rather than
re-deriving the sequence from scratch.

## Stack & constraints

- Static HTML/CSS/JS. No framework, no build step, no bundler, no database.
  Every page is a flat `index.html` + shared `assets/css/style.css` and
  `assets/js/main.js`.
- Content is managed two ways: (1) directly editing HTML files in this repo,
  or (2) a custom git-based admin CMS at `admin/index.html`, which does
  regex find/replace between `<!--EDIT:TITLE:START-->...<!--EDIT:TITLE:END-->`
  and `<!--EDIT:BODY:START-->...<!--EDIT:BODY:END-->` markers. Keep those
  markers intact in every blog article.
- Bilingual: `/` (Italian, default) and `/en/` (English) mirror each other
  structurally. The blog (`/blog/`) is Italian-only by design.
- Local preview: `.claude/launch.json` defines `static-preview`
  (`python -m http.server 4173`). Use the Claude Browser preview tools
  against it — never start a dev server with Bash.

## Git workflow (non-negotiable)

- Before staging anything: `git fetch origin` + `git log HEAD..origin/main --oneline`
  to check for divergence (the admin CMS can push commits independently/async).
  Re-check after staging, right before `git push`.
- Stage specific files by name. Never `git add -A` or `git add .`.
- Commit messages end with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Never force-push, never skip hooks.

## Design system

CSS custom properties, defined in `assets/css/style.css` `:root`:

```
--bg:#121214  --bg-soft:#1a1a1d  --surface:#1c1c20  --panel:#0a0a0b
--ink:#f3f1ea  --ink-dim:#aba79c  --ink-faint:#747068
--line: rgba(243,241,234,0.1)  --line-strong: rgba(243,241,234,0.4)
--accent:#5b84ff  --accent-strong:#8aa6ff  --accent-soft:rgba(91,132,255,0.14)
--accent-2:#e08a4e (warm, secondary accent)
--radius-lg:28px  --radius-md:18px  --radius-sm:12px
```

- Fonts: **Bricolage Grotesque** (headings/display, weight 700–800) and
  **Inter** (body), both via Google Fonts `@import` in `style.css`.
- Dark theme only — no light mode toggle.
- Buttons: `class="btn btn-primary"` (filled, accent) / `class="btn btn-ghost"`
  (outline). Pills: `class="tag"`.
- Illustration motif used across cover images (blog articles, `og-cover.jpg`,
  the LinkedIn banner, the Blogspot theme): a bright accent-colored "spark"
  node connected by a dashed path to dimmer unconnected nodes, on a dark
  gradient background with a faint dot-grid texture. Reuse this, not a new
  visual language, when a new cover/illustration is needed.
- `.reveal` elements fade/slide in on scroll via `IntersectionObserver` in
  `main.js`, with a **1.5s forced-visible safety-net timeout** — this means
  content that starts hidden (e.g. inside a closed `<details>`) is still safe
  to mark `.reveal`; it will not get stuck invisible. See the "collapsible
  sections" pattern below for why this matters.
- Cache-busting: `style.css` and `main.js` are referenced as `?v=N` on every
  page. Bump `N` **everywhere it appears** (all pages, including `admin/`)
  whenever either file changes, via a global `v=<old>` → `v=<new>` replace.
  Current version: check `grep -o "style.css?v=[0-9]*" index.html`.

## Content policy

- Blog articles are adapted into **third person** (never implying Nicola
  personally wrote the piece as a first-person confessional) unless a
  specific article is explicitly agreed to be first-person.
- Never reproduce third-party copyrighted material. Claude-authored
  artifacts the user brings in are their own work, not third-party content.
- SEO/structured data: every page has canonical, OG/Twitter meta, and
  JSON-LD. Keep the real domain (`nicolagrillo1984.github.io/personalsite`)
  everywhere — this was previously broken by a non-owned `nicolagrillo.dev`
  reference and had to be fixed across 8 files.
- Blog articles cross-link: each ends with a "Continua a leggere" section
  (`.related-section` / `.related-card`) pointing to its ~2 most topically
  related posts. Keep this web connected when adding a new article — pick
  2 related posts and also add the new article to 1–2 existing articles'
  related blocks if it's a better fit than what's there.
- Every blog article carries an explicit copyright notice: a visible
  `.article-copyright` line right after `.article-tags` (© + "tutti i
  diritti riservati" + no-reproduction wording) and matching
  `copyrightHolder`/`copyrightYear` fields in the article's JSON-LD. This
  is the real protection (a legal rights claim + a machine-readable
  signal); deliberately **not** implemented as text-selection/right-click
  blocking, which the user considered and rejected as trivially bypassable
  (view-source/DevTools) and harmful to accessibility and legitimate
  quoting. See `blog/prima-degli-agenti-le-basi/index.html` for the
  pattern.
- **Collapsible sections for content that's valid but not worth showing by
  default** (e.g. full CV timeline, which duplicates LinkedIn): use native
  `<details class="collapsible-section"><summary>...</summary>...</details>`,
  never `display:none`/`visibility:hidden`/off-screen tricks. Google's spam
  policies explicitly flag hidden text as a penalizable technique;
  `<details>` content is fully present in the HTML and Google-documented as
  crawlable even when collapsed. See `index.html#competenze` /
  `#esperienza` for the working pattern.

## Verification workflow (before calling anything done)

1. `static-preview` running, reload the page.
2. `read_console_messages` with `onlyErrors: true` — zero tolerance for new
   errors.
3. Check mobile: `resize_window` to the `mobile` preset, confirm
   `document.documentElement.scrollWidth === window.innerWidth` (no
   horizontal overflow) — this project has shipped invisible-on-mobile
   content bugs before.
4. Click through any new interactive element (accordions, forms, toggles).
5. Only then: git fetch/stage/commit/push, per the workflow above.

## Analytics, SEO & distribution (state as of 2026-10-31)

- **Google Analytics 4** (`G-EZW7PYTDT3`) via `gtag.js` with **Consent Mode
  v2**, default `analytics_storage: denied`. A cookie banner
  (`assets/js/analytics.js`, `.cookie-banner` in every public page) gates
  consent — required because the audience is EU/IT. Never add tracking that
  fires before consent.
- `feed.xml` (RSS) at the site root, linked via `<link rel="alternate"
  type="application/rss+xml">` on every public page.
- `sitemap.xml` and `robots.txt` point at the real domain; submitted to
  Google Search Console.
- A legacy blog, `nicolagrillo.blogspot.com` (58 posts, 2010–2020, Microsoft
  Dynamics CRM topics), is kept **as an SEO/authority asset**, not
  abandoned: it has its own custom Blogger theme (source kept in
  `blogspot-theme/` in this repo, not part of the deployed site) matching
  this site's branding, with a CTA back to the real site and the old posts
  preserved as an "archive" at their existing URLs (no redirects — the
  explicit decision was to keep this site as the canonical "home" and treat
  Blogspot as a bridge, not to migrate/merge content).
- LinkedIn (`linkedin.com/in/nicola-grillo-2277b113`) and the GitHub profile
  (`github.com/nicolagrillo1984`, via a `nicolagrillo1984/nicolagrillo1984`
  README repo) are the other anchor properties. A site-styled banner image
  lives at `assets/img/linkedin-banner.jpg` — not referenced by any page on
  this site, but used externally as the header image on both the LinkedIn
  cover and the GitHub profile README (so it needs a stable public URL,
  which is why it's committed here). Regenerate via the Pillow script
  pattern used for `og-cover.jpg` if it needs updating, not a redesign from
  scratch.

## Compliance & security (state as of 2026-10-31)

- The admin CMS (`admin/index.html`) uses a user-supplied, fine-grained
  GitHub personal access token (repo-scoped, content read/write only),
  entered each session. It is kept only in page memory — never written to
  `localStorage`, never sent anywhere except `api.github.com` over HTTPS.
  `robots.txt` disallows `/admin/` and the page ships
  `<meta name="robots" content="noindex, nofollow, noarchive">`. Preserve
  all of this exactly if `admin/index.html` is ever touched.
- **Known gap**: there is no standalone privacy/cookie policy page. The
  cookie banner's inline explanation is not a substitute for one — this is
  an open item, not yet scheduled.
- GA4 consent handling is covered above under Analytics; it's also the
  main GDPR-relevant mechanism on the site today.

## Where things are

- `index.html`, `en/index.html` — homepage (IT/EN mirror).
- `blog/index.html` — article listing; `blog/<slug>/index.html` — articles.
- `admin/index.html` — the git-based CMS.
- `assets/css/style.css`, `assets/js/{main,news,analytics}.js`,
  `assets/img/`.
- `blogspot-theme/` — source for the Blogspot custom theme (not deployed by
  GitHub Pages; applied manually via the Blogger dashboard).
