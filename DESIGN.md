# Design rules for Dealer Ask pages

Every page Claude adds follows this file. It is short on purpose: the point is that a general manager reads a number,
trusts it, and knows which dates it covers. Style is in `app/globals.css`; this file says what the styles mean.

## Brand

| Token | Default | Used for |
|---|---|---|
| `--teal` | `#1F6B86` | The primary brand colour: buttons, links, the main bar in charts, active tabs |
| `--teal-soft` | `#E3EEF3` | A light tint of the primary: quiet buttons, pills, selected rows |
| `--ink` | `#1A2027` | Body text and big numbers |

`PROMPTS/01b-brand.md` replaces the first two with the colours from your group's website. Nothing else changes for a
brand: the rest of the palette is about meaning, not identity.

Brand source: default (Ridgeline placeholder). Prompt 01b writes the website and the two colours it chose here.

## Meaning colours (do not rebrand these)

| Token | Colour | Means |
|---|---|---|
| `--amber` / `--amber-soft` | `#A86A0B` / `#FBF1DF` | Coverage warning: a store that did not report, a partial month, a lagging snapshot, "you cannot see this" |
| `--green` / `--green-soft` | `#2E7D5B` / `#E4F2EA` | A check passed, a change saved |
| `--red` | `#A3382F` | An error in the app, never a low number |
| `--muted` | `#5B6672` | Labels, dates, secondary text |
| `--ground` / `--card` / `--line` | `#F2F4F6` / `#FFFFFF` / `#D5DBE1` | Page background, card background, hairlines |

A low number is not red and a high number is not green. Colour marks the data's trustworthiness, not its size.

## Type

- Headings (`h1`, `h2`, `.big`) in the serif (Cambria); everything else in the sans (Calibri, then the system font).
- Page title 1.6rem, section title 1.15rem, tile number 1.8rem, body 16px, labels 0.78rem uppercase with letter spacing.
- Plain English labels. "Units MTD", not "unit_count_sum". Store names, never store codes, anywhere a person reads.

## Layout

- One column, max width 64rem, centred. Cards and tiles on the grey ground, never cards inside cards.
- Tiles: `.tiles` grid, `minmax(13rem, 1fr)`, gap 0.8rem. A tile is label, big number, sub line. At most five per row.
- Tables: `.card` around a `table`; uppercase muted headers; right-align numbers; one store per row; a total row only when
  the person can see every store in it.
- Charts: `components/Bars.tsx`, horizontal, one bar per store. No other chart library.
- Nothing scrolls sideways. On a phone the grid stacks on its own; do not add breakpoints.

## Every page states what it covers

- Under the title, one `.lede` line with the window: "Month to date through 2026-09-05" or "Latest snapshot, 2026-08-31".
- A store whose rows stop early gets a `.flag` line: "Ridgeline Kia did not report after 2026-09-02. Its numbers stop
  there; they are not zero." The flag is amber, above the numbers, in words.
- A person who lacks the feature for a page is sent to `/denied` by the server before any query runs (`requireFeature`).
  A person who lacks a store never sees it, because every query carries `storeFilter(scope)` through `q()`.
- Money formats as `$28,571`; rates as `$167.04 / hr`; percentages with one decimal; dates as ISO `2026-09-05`.

## Adding a page

1. Server component under `app/…/page.tsx`. First line: `const scope = await requireFeature("sales")` (or `service`).
2. Queries live in `lib/dashboard/`, one function per view, each calling `q(scope, table, sql)` with `storeFilter(scope)`.
   One catalog table per query, no joins; combine in code.
3. A link in `components/Nav.tsx` gated by the same `can(scope, feature)` the page uses. A visible link never implies access.
4. A test in `lib/dashboard/*.test.ts` on the in-process database: the Kia GM sees one store; a person without the
   feature is refused before any SQL runs.
