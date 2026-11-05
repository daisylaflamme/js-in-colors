# Official mockups

These images are the **visual reference** for the app. When a task says "build the lesson screen", match these. The tokens are in [`design-tokens.css`](design-tokens.css).

Fonts in the images are approximate (rendered with a fallback). The real app uses **Baloo 2** (display) and **Nunito** (body), self-hosted.

| # | File | Screen / state |
|---|------|----------------|
| 01 | `01-lesson-default.png` | Lesson screen, default (Variables, scene 3 of 5) |
| 02 | `02-lesson-menu-collapsed.png` | Same, left menu collapsed by the hamburger |
| 03 | `03-lesson-tip-open.png` | Tip popover open |
| 04 | `04-lesson-library-and-code-peek.png` | Library drawer open (code panel visible behind) |
| 05 | `05-lesson-pick-word.png` | Choice "Emma" picked (word, green pill) |
| 06 | `06-lesson-pick-yes.png` | Choice "yes!" picked (boolean, purple diamond) |
| 07 | `07-lesson-code-peek.png` | "Peek at the code" open |
| 08 | `08-home-color-path.png` | Home: the color path (lesson map) |
| 09 | `09-ask-dot-chat.png` | Ask Dot chat (demo mode) |
| 10 | `10-certificate.png` | Certificate with typed name |
| 11 | `11-design-tokens.png` | Concept colors and shapes with measured contrast |
| 12 | `12-tablet-lesson.png` | Tablet (820 wide): menu closed, tabs on the right edge |
| 13 | `13-phone-lesson.png` | Phone (390 wide): default |
| 14 | `14-phone-menu-open.png` | Phone: menu as an overlay |
| 15 | `15-phone-library-sheet.png` | Phone: Library as a bottom sheet |
| 16 | `16-phone-tip.png` | Phone: Tip card above the tab bar |

## The lesson screen (the main screen)

Layout, left to right:

1. **Lesson menu** (`nav`, 280px, white). Logo, "Your color path 2 of 10" with a progress bar, then the 10 lessons. Each item: concept **shape icon**, lesson name, a small subtitle (the real JS word, e.g. "Variables"), a green check when finished. The current lesson has a soft tint background and the subtitle "You are here". Footer card: "No account needed" + resume code (`blue-fox-42`).
2. **Main column** (fluid, padding right 120px so the right tabs never cover content):
   - Top bar: **hamburger button** (52px, left), "Lesson 3 of 10".
   - Title (Baloo 2, 60px, in the concept color), one-sentence lead (24px).
   - "Jars can hold:" row of concept chips (shape + word, never color alone).
   - **Stage** (white card, radius 32px, min 380px high): Dot the mascot with a speech bubble (`aria-live="polite"`), and the interactive picture (a jar with a name tag).
   - **Choices row**: "Pick something for the jar:" + one button per choice (selected = solid concept color with ink border and press shadow, `aria-pressed="true"`; unselected = tint with colored border). At the right end: **Peek at the code** toggle.
   - **Code panel** (dark, appears under the choices when Peek is on): one line of real JS plus three plain-words lines explaining each part. It is a peek, not an exercise.
   - **Bottom row**: **Back** (outlined), scene dots + "Scene 3 of 5", **Next** (yellow, labeled just "Next").
3. **Right-edge tabs** (88px squares attached to the right edge, top about 190px): **Tip** (yellow), **Library** (teal), **Read to me** (white). All closed by default.
   - **Tip**: small popover card to the left of the tabs, one sentence. Close button (44px).
   - **Library**: right drawer (420px, full height) with the lesson's longer text, "Read this page to me", the concept list, "Words to know", and a link "Still curious? Ask Dot" (opens the chat).
   - **Read to me**: reads the current scene (Web Speech API, optional).

### Hamburger behavior

- The hamburger sits in the **top-left of the main column**, so it stays in the same place whether the menu is open or closed.
- It toggles the left menu. `aria-label="Lesson menu"`, `aria-expanded` reflects state.
- Closed: the menu is removed from the layout (the main column grows to full width) and the small logo + "JavaScript in Colors" appears beside the hamburger.
- Default: open on wide screens, closed below about 900px. Remember the user's choice (local state).

### Interaction rules

- Picking a choice changes the jar contents, the speech bubble and the code line together.
- Tip, Library and Peek are independent toggles, except Tip and Library are mutually exclusive.
- `Esc` closes Tip or Library; focus returns to the tab that opened it. Library and Tip trap focus while open.
- One primary action per scene: **Next**.

## Responsive: build mobile-first

Start from the phone layout and add larger layouts with `min-width` queries. Breakpoints: sm 600, md 900, lg 1200.

| | Phone (base, 390 wide) | Tablet (md, 820 wide) | Desktop (lg, 1440 wide) |
|---|---|---|---|
| Lesson menu | Overlay from the left (322px) over a dimmed lesson; opened by the hamburger, closed by X, by tapping the dim area, or with Esc | Closed by default; hamburger opens it | Open by default; hamburger collapses it |
| Tip / Library / Read to me | **Bottom tab bar** (3 equal buttons, 62px). Library = bottom sheet. Tip = card above the bar | Right-edge tabs | Right-edge tabs |
| Header | Hamburger, small logo + name, "3 of 10" | Hamburger, small logo, "Lesson 3 of 10" | Same, with the menu open the logo moves into the menu |
| Stage | Dot (small) with bubble on top, jar below, one column | Dot with bubble above, jar below, centered | Dot left, jar right |
| Concept chips | One row that scrolls sideways (no visible scrollbar) | Wrap | Wrap |
| Choices | Wrap onto two lines if needed; "Peek at the code" on its own line | Same | One row, Peek at the right end |
| Back / dots / Next | Pinned above the tab bar | In the page flow | In the page flow |
| Title | 42px | 60px | 60px |

Rules for all sizes: 44px minimum targets (most are 48 to 56px), no horizontal page scroll at 320px, nothing relies on hover, content works at 200% text size, respect safe areas on notched phones, and the Library bottom sheet traps focus, closes on Esc and returns focus to the Library tab.

Home, chat and certificate are only mocked at desktop. On smaller screens: stack the layout in one column, keep the same components, and let the color-path map scroll vertically (one lesson per row).

## Other screens

- **Home / color path (08):** header with resume code pill + Copy, "Calm motion" and "Text size" toggles; Dot greeting; **Continue: Variables** button; a zigzag path of the 10 lessons as concept shapes (finished = check, current = dashed ring with Dot beside it, last = star "Your certificate!"); legend "What the colors mean".
- **Ask Dot (09):** demo mode pill, message list, typing indicator, suggested questions, input + Send, and a "Dot's safe chat rules" panel. A "Back to the lesson" link returns to the lesson. Chat is in memory only.
- **Certificate (10):** "Certificate of Discovery", name typed by the child (label: "Name on the certificate", note that it stays on this device), Download and Print, the six concept shapes, Dot, date, seal.
- **Tokens (11):** the concept palette.

## Concept color, shape, word

| Concept | Kid word | Shape | Token |
|---|---|---|---|
| Number | numbers | circle | `--color-number` |
| String | words | pill | `--color-string` |
| Boolean | yes or no | diamond | `--color-boolean` |
| Object | things | rounded square | `--color-object` |
| Array | lists | triangle | `--color-array` |
| Function | helpers | hexagon | `--color-function` |
| Variable | jars | tall capsule | `--color-variable` |
| DOM / html | page magic | window | `--color-html` (crimson, ADR 0009) |

## Accessibility notes already designed in

- Color is always paired with a shape and a word.
- All controls 44px or larger; text 16px or larger for body copy; ratios measured (AA or better).
- Real `<button>`, `<nav aria-label="Lessons">`, `role="progressbar"` for lesson progress, `aria-pressed` on choices, `aria-expanded` on tabs and hamburger, `role="dialog"` with a label on Tip and Library.
- Speech bubble is a polite live region so screen readers hear the jar change.
- Every animation needs a `prefers-reduced-motion` alternative (the "Calm motion" toggle on Home overrides it).

## Not decided yet

- Dark and high-contrast themes are not mocked. Derive them by overriding tokens only.
- Home, chat and certificate are not mocked on phone or tablet (rules above). The certificate stacks its controls above the sheet; the sheet keeps Dot, the date and the seal in one row at every size.
