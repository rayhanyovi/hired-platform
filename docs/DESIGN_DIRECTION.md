# Design Direction: Amara Desk

**Last updated:** 11 Oct 2026 · Source of truth for tokens: `app/globals.css`

## 1. One-line direction

A calm, dark, monochrome workspace where **colour is information** and **the Amara gradient means a machine is speaking**. It should feel like a tool a recruiter keeps open all day, not a demo of AI.

## 2. Principles

1. **Colour means something.** Neutral by default. White = the primary action. Metric colours = the funnel stage. Amber / frost = a deal needs attention. Invoice status colours appear on the left edge and status tag. Nothing is coloured for decoration.
2. **The gradient is Amara's voice.** The pink → violet gradient (from the logo) appears only on AI-authored content and AI actions. If you see it, a model wrote it or will write it.
3. **AI drafts, humans send.** Every AI output is editable, shows what it was built from ("What Amara used", "Read from CV, cover letter and 5 screening answers"), and needs a click to go anywhere.
4. **AI on request.** Expensive generation sits behind a button (Draft with Amara, Explain, Chase). Pages load with real data, not with a spinner waiting for a model.
5. **Show the source next to the summary.** Amara's screening sits one tab away from the original application; Amara's read sits next to the deal's activity.
6. **One entry point for asking.** Every "ask" anywhere opens the same drawer with the context already attached. No second chat box.
7. **Quiet by default, loud when it matters.** Hover reveals secondary actions on desktop (Ask on a metric, Draft on a task); on touch they're always visible.

## 3. Foundations

### Surfaces (darkest → lightest)
| Token | Hex | Use |
|---|---|---|
| `ink-sunken` | `#141414` | Chrome: rail, lists inside panels, preview wells |
| `ink` | `#1c1c1c` | Page background |
| `surface` | `#212121` | Cards, panels |
| `raised` | `#282828` | Selected rows, active tabs |
| `hover` | `#2e2e2e` | Hover |
| `line` / `line-strong` | white 7% / 11% | Dividers, borders |

### Text
`fg #ededed` for content, `fg-muted #a3a3a3` for supporting text, `fg-faint #6e6e6e` for labels and metadata.

### Brand and AI
| Token | Hex | Use |
|---|---|---|
| `primary` / `primary-foreground` | `#f2f2f2` / `#171717` | White primary controls with dark text |
| `brand` | `#ec7cf4` | Brand accent and search match highlighting |
| `amara-pink → amara-violet` | `#eca1f6 → #936fef` | AI gradient: `AmaraMark`, `.amara-edge` border, `.amara-gradient-text`, `.amara-orb` |
| `amara-wash` | violet 10% | Tinted backgrounds behind AI cards |

### Funnel metrics
Each stage owns an accent and a darker tile colour, used in icons, bars and leaderboard headers:
calls `#ec7172` · submittals `#f1913d` · interviews `#b684f4` · offers `#6ea1f0` · placements `#5bcf9c`.

### Status
good `#5bcf9c` · bad `#ec6c6c` · warm (cooling) `#e3a857` · cold `#8ebcef` · invoice rows share the standard `surface` background. Paid green, sent blue, draft grey and overdue red appear only in each status tag and 3px left edge.

### Type
| Family | Use | Never |
|---|---|---|
| **Inter** | All UI and body | — |
| **Playfair Display** | Greetings ("Olá, Sam") and empty-state headlines only | Numbers, briefs, buttons |
| **JetBrains Mono** | Timestamps, figures in tables, keyboard hints | Paragraphs |

Figures use `.num` (tabular numerals). Big metric values are 32px Inter, not serif.

### Shape and motion
- Radius: 8px controls, 12px cards, 16px panels, full for pills.
- Motion is short and eased (`cubic-bezier(0.2, 0, 0, 1)`): `rise` 420ms for new content, `drawer` 360ms, `pop` 220ms for palettes. Streaming text replaces spinners. All motion respects reduced-motion.

## 4. Components that carry the language

| Component | Rule |
|---|---|
| `AmaraButton` (sm / md / lg) | The only AI action style: a gradient edge bright at the top-left that fades toward the bottom-right, over a faint plum wash; AmaraMark; normal text colour. Hover brightens both. Used for Ask, Explain, Chase, Draft, Draft with Amara, Next move |
| `AmaraTag` | Non-interactive AI label (e.g. pipeline card "next move", Amara insight lines) |
| `AmaraByline` | Header on AI-written blocks: "Amara's read", "Drafting", "Screening" |
| `Button` primary | White fill with dark text. Human commitment: Send, Shortlist, Add client |
| `Button` secondary / ghost | Everything else |
| Subpage tabs | Shared `SubpageTabs` on Home, Documents and Team: icon + label, rounded selected pill with border, no enclosing group border |
| Segmented toggles | Inset pill group on `surface`, selected = `raised`; used for filters and list/board switches |
| Metric card | Icon + label row (Ask on hover) → 32px value → quiet trend line |

## 5. Patterns

- **Context chip** in the Ask drawer: "Looking at {page} · {one-line summary}", removable.
- **Day 1 vs Day 30**: every Home panel has a designed empty state that teaches the next action, rather than zeros.
- **Original vs AI**: tabs "Amara's screening | Application", with a provenance line linking between them.
- **Blank then draft**: composers start empty with a placeholder that suggests both paths (write it yourself or let Amara draft).
- **Hide numbers**: an eye toggle masks money and counts for screen sharing.
- **Home entrance**: once per member per local calendar day in the same browser/origin, a centred orb shifts left for a character-typed welcome. The greeting moves into its normal layout position before Amara’s stage-specific message appears. The purple sky glow then contracts and fades, followed by Overview, Tasks, Invoices and Leaderboard revealing in sequence. Reloads and internal navigation back to Home on that day skip the entrance. The day is claimed when the entrance starts, even if navigation interrupts it. Reduced motion skips the introduction.
- **Tours**: `?` or the help button runs a per-page tour targeting `data-tour` attributes. The first-visit Home tour waits for the entrance and panels to finish.
- **Expand in place**: on Candidates and Prospects a row opens inside the table (who they are · what's going on · tasks and notes, with the obvious next step in a footer) instead of navigating away. Use it for any list where people work through records one by one.
- **One status per record**: a status pill with a dot opens a menu; options that can't be reached from here stay visible but disabled, with the reason underneath. Dots are neutral except funnel stages (metric colours), "needs you" (amber) and done (placements green).

## 6. Responsive

- ≥1280px: rail + page; Ask drawer pushes content aside (`xl:pr-[440px]`).
- <1280px: drawer overlays and closes when a link inside it is followed.
- <768px: mobile header (search + compact Ask), bottom nav (Home, Chat, Candidates, Communication, More), wide tables scroll horizontally inside their card.

## 7. Don'ts

- No gradient on non-AI UI. No bright brand fill on secondary actions.
- No serif for numbers or body copy.
- No auto-generated AI content on page load where the user might not need it.
- No emoji, no illustration filler, no glassmorphism beyond the drawer backdrop.


## Candidates and Placements (13 October review)

Candidates is a neutral talent database, with no pipeline status, application queue or board. Its expandable records contain Profile, History and Notes. Placements holds recruiting stages and keeps list expansion plus a board whose cards open the next required form. One talent profile supports several independent company/role processes. Clients, Candidates and Placements share the native `TableHeader` treatment: 11px uppercase muted labels, 0.06em tracking, normal weight, 12px vertical padding and the standard divider. Status washes belong to placement rows; AI styling remains reserved for assistant actions and drafts.

### Expanded tables

Data table/list workspaces use `TableWorkspace`: Expand fills the area below the app header, hiding page overviews behind the data workspace while keeping the navigation rail available. Filters and row state remain mounted. Back to page or Escape restores the page; an open modal takes Escape first. Documents rendered as document content and nested audit field diffs are not separate workspaces. Candidate collections are neutral sheet tabs below the table, with counts and a plus button for creation.
