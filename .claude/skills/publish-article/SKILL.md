---
name: publish-article
description: Orchestrates the full pipeline for publishing a new blog article on nicolagrillo1984/personalsite — drafting, technical review, verification, compliance, and a publish gate — by calling the specialized agents in CLAUDE.md in the right order instead of doing everything in one undifferentiated pass. Use whenever the user asks to publish, write, draft, or add a new blog article, or gives a topic/brief/artifact "for the blog".
---

# Publishing an article: the orchestration

You (the main session) are the orchestrator. Don't write the article yourself — call the agents below via the `Agent` tool, in order, and drive the pipeline. Read `CLAUDE.md` first if you haven't this session; every agent prompt you write should point back to it rather than re-explaining the stack/voice/template.

Each `Agent` call starts a fresh subagent with no memory of this conversation. Give every one a self-contained prompt: the actual source material (paste the brief, the artifact content, or its URL — don't say "write an article" and assume it knows what about), the exact file paths involved, and what "done" looks like for its step.

## 1. Gather the source

If the user gave a topic, a brief, or an artifact link, use it as-is. If they just said "pubblica un articolo" with nothing else, ask what it's about before spawning anything — don't guess a topic.

## 2. Draft — `content-writer`

Spawn `content-writer` with the source material and a direction to produce (not commit): the article HTML following the template, a cover SVG, the required `.article-copyright` notice + JSON-LD `copyrightHolder`/`copyrightYear` (see `CLAUDE.md` content policy), and the planned diffs to `blog/index.html`, `sitemap.xml`, `feed.xml`. Tell it which existing articles are plausible "Continua a leggere" matches, or ask it to pick.

## 3. Technical review — `ai-data-expert`

Spawn `ai-data-expert` with the drafted article's text, to review for domain credibility per its own instructions. Don't skip this even for a topic that seems safe — it's cheap and it's caught real gaps before.

## 4. Gate 1 — user approval of the draft

Present the draft plus `ai-data-expert`'s findings to the user together, with your own honest read on quality (the established pattern on this project: adapt, then an honest review, not just "done"). **Do not proceed past this point without an explicit go-ahead.** If they want changes, loop back to step 2 with specific direction, not a vague "make it better."

## 5. Site changes, if any — `site-developer`

Only if the article needs something beyond the standard template (a new component, a new embed) — spawn `site-developer` for that specific piece. Most articles don't need this; don't spawn it out of habit.

## 6. Verification — `qa-tester`

Spawn `qa-tester` to run its full checklist against the draft: console errors, mobile overflow, the cover renders, the new "Continua a leggere" links resolve both ways, RSS/sitemap entries are well-formed, and the `.article-copyright` notice + JSON-LD copyright fields are present. Get a pass/fail report, not a vibe check.

## 7. Compliance pass — `compliance`

Spawn `compliance` for the parts relevant to a new article: copyright/content-policy adherence, alt text on any new images, nothing that silently starts tracking before consent. This should be fast — it's a narrow pass, not a full-site audit.

## 8. Fix loop

If `qa-tester` or `compliance` report a failure, send it back to `content-writer` (content issues) or `site-developer` (code issues) with the specific finding, then re-run the agent that caught it. If the same thing fails twice, stop and surface it to the user instead of looping again.

## 9. Security, conditionally — `security`

Only if step 5 happened (site-developer touched code, especially anything touching `admin/index.html`, new third-party scripts, or new data handling). Routine content-only articles don't need this step — don't run it by default.

## 10. Gate 2 — publish approval

Once everything above passes: run the `CLAUDE.md` git workflow up through a ready-to-push commit (fetch/divergence check, stage by name, commit with the required trailer). **Ask for explicit confirmation before `git push`** — this has been the pattern for every publish on this project so far ("Pubblica" as its own, separate approval from "the draft looks good").

## 11. After publish (offer, don't force)

- Offer `marketing` to draft LinkedIn share copy for the new article.
- Only call `architect` to update `CLAUDE.md` if this article was structurally significant (new section type, new cross-link pattern, a policy decision) — a routine article following the existing template isn't.

## What "necessari" means in practice

Not every publish needs every agent — that's the point of orchestrating rather than running all 9 every time. A routine, template-following article needs: content-writer, ai-data-expert, qa-tester, compliance, and the two user gates. site-developer and security are conditional on there being actual code changes. marketing and architect are offered, not automatic.
