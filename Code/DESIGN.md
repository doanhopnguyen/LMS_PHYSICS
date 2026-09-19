---
name: PTIT Physics 1 Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#5b403d'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#8f6f6c'
  outline-variant: '#e4beb9'
  surface-tint: '#b91c1c'
  primary: '#93000b'
  on-primary: '#ffffff'
  primary-container: '#b91c1c'
  on-primary-container: '#ffcdc7'
  inverse-primary: '#ffb4ab'
  secondary: '#755b00'
  on-secondary: '#ffffff'
  secondary-container: '#fccc38'
  on-secondary-container: '#6f5600'
  tertiary: '#005223'
  on-tertiary: '#ffffff'
  tertiary-container: '#006d30'
  on-tertiary-container: '#8bed9d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#ffdf90'
  secondary-fixed-dim: '#f0c12c'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#584400'
  tertiary-fixed: '#95f8a7'
  tertiary-fixed-dim: '#79db8d'
  on-tertiary-fixed: '#00210a'
  on-tertiary-fixed-variant: '#005323'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  display-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 24px
  body-md-medium:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 24px
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
This design system establishes an academic, rigorous, and technologically advanced learning interface tailored for engineering and telecommunications students tackling General Physics 1. Combining the institutional heritage of the Posts and Telecommunications Institute of Technology with contemporary digital pedagogy, the design balances authority and intellectual clarity with an approachable, low-cognitive-load experience.

The overall aesthetic aligns with **Corporate / Modern** precision infused with scholarly structure:
- **Clean Architectural Grids:** Uncluttered layouts prioritize complex formulas, dynamic physics simulations, and structured practice problem tiers.
- **Academic Authority:** Anchored by institutional crimson and focused slate neutrals, inspiring disciplined study habits and clarity.
- **Calm Focus:** Eliminates gratuitous visual noise, enabling sustained concentration over dense derivation steps, analytical diagrams, and step-by-step solutions.

## Colors
The color architecture reinforces institutional pride, visual hierarchy, and accessible contrast for long study sessions:

- **Primary Shades:**
  - `Brand Identity Red`: `#D71920` (Logos, flagship accents, institutional markers)
  - `Primary Action Red`: `#B91C1C` (Primary buttons, active indicators, interactive links)
  - `Primary Hover`: `#991B1B`
  - `Primary Active`: `#7F1D1D`
  - `Primary Light Tint`: `#FEE2E2` (Soft badge backgrounds, active navigation selections)
  - `Primary Ultra Light`: `#FEF2F2` (Contextual callout fills, highlight zones)

- **Secondary Accent:**
  - `Accent Gold`: `#F4C430` (Star ratings, gamification tokens, XP counters, honors tags)

- **Neutrals & Surfaces:**
  - `App Background`: `#F8FAFC` (Canvas background reducing eye strain)
  - `Surface Default`: `#FFFFFF` (Card surfaces, modals, popovers)
  - `Surface Secondary`: `#F1F5F9` (Sidebar, table headers, code blocks)
  - `Border Default`: `#E2E8F0` (Card outlines, dividers)
  - `Border Strong`: `#CBD5E1` (Input borders, defined component margins)
  - `Text Primary`: `#1F2937` (Headings, primary body content)
  - `Text Secondary`: `#64748B` (Supporting explanations, metadata, secondary labels)
  - `Text Muted`: `#94A3B8` (Placeholders, inactive tabs, disabled text)

- **Semantics:**
  - `Success`: `#15803D` (Correct derivations, completed modules)
  - `Warning`: `#B45309` (Exam deadlines, intermediate test warnings)
  - `Error`: `#DC2626` (Incorrect solution steps, system alerts)
  - `Info`: `#475569` (Analytical notes, physics context boxes)

## Typography
Typographic hierarchy is set using **Be Vietnam Pro** (with fallback to Inter and clean system sans-serifs). This choice ensures optimal legibility for Vietnamese tone marks alongside mathematical notations and scientific terminology.

- **Headings (700 & 600 weight):** Deliver structural clarity for chapter modules, formula derivations, and problem sets without overpowering the page.
- **Body Text (400 & 500 weight):** Formatted with a relaxed 1.6-1.7 relative line-height to enable comfortable, sustained technical reading and eliminate visual crowding between inline math elements.
- **Scientific Equations & Mathematical Characters:** Maintain proportional baseline alignment with adjacent body text, paired with monospaced treatments for vector matrices and tabular datasets.

## Layout & Spacing
The layout follows a precise 8px rhythmic baseline (`0.25rem` through `4rem`), structuring an intentional, non-distracting study environment.

### Frame Architecture
- **Fixed Navigation Sidebar:** `256px` fixed width on desktop displays (`>= 1024px`), housing curriculum chapters, topic trees, and simulation laboratory links. Collapses to an off-canvas drawer on tablet and mobile viewports.
- **Sticky Top App Bar:** `72px` fixed height, containing the active course unit breadcrumbs, global formula search, notification bell, and user profile avatar.
- **Main Working Canvas:** Fluid workspace bounded by standard 16px to 24px inner margins, dynamically adapting to wide screens while centering exercise content to max `1280px` for optimal reading spans.

### Breakpoint Matrix
- **Mobile (< 768px):** 1-column layout; gutter `16px`; canvas margin `16px`. Sidebar transforms into a bottom sheet or sliding off-canvas drawer.
- **Tablet (768px - 1023px):** 2-column or compressed single-column; gutter `20px`; canvas margin `20px`; sidebar collapses to a 72px icon rail.
- **Desktop (>= 1024px):** Full 12-column workspace grid with 256px persistent navigation; gutter `24px`; outer canvas padding `24px`.

## Elevation & Depth
Elevation in this system uses subtle, razor-sharp architectural borders alongside soft ambient ambient drops to preserve a crisp academic workbook feel:

- **Flat Border Baseline:** Every structural card, panel, and table uses a crisp `1px solid #E2E8F0` boundary, anchoring items firmly to the `#F8FAFC` foundation.
- **Default Card Elevation:** `0 1px 3px rgba(15, 23, 42, 0.04)` combined with the border, establishing immediate tactile presence without visual weight.
- **Interactive Card Hover:** `0 6px 20px rgba(15, 23, 42, 0.08)` accompanied by a gentle `-2px` Y-axis transition, communicating responsiveness for clickable quizzes and module cards.
- **Dropdown & Flyout Elevation:** `0 10px 25px -5px rgba(15, 23, 42, 0.10), 0 8px 10px -6px rgba(15, 23, 42, 0.05)` with `1px solid #CBD5E1`.
- **Modal Backdrops & Dialogs:** Layered at `z-index: 50` over a `rgba(15, 23, 42, 0.40)` backdrop blur (`4px`), casting `0 25px 50px -12px rgba(15, 23, 42, 0.25)` to demand focus during practice exams and laboratory simulations.

## Shapes
The shape language is calibrated with component-specific geometric radiuses that deliver a refined, modern collegiate software experience:

- **Buttons & Form Inputs:** `10px` (`0.625rem`) creates an inviting, tactile target that remains crisp and professional.
- **Cards & Content Panels:** `16px` (`1rem`) provides a friendly frame for formula blocks, lecture segments, and question panels.
- **Modals & Dialogs:** `20px` (`1.25rem`) softens large floating structural overlays.
- **Dropdown Menus & Popovers:** `12px` (`0.75rem`) for compact contextual menus.
- **Tags, Chips & Badges:** `6px` (`0.375rem`) for sharp, legible categorizations.
- **Progress Trackers & Pills:** `999px` (fully rounded) for chapter progress, difficulty indicators, and quiz scores.
- **Avatars:** `50%` (circular) for student and faculty portraits.

## Components

### Buttons
- **Primary:** Filled `#B91C1C` with white text, `10px` border-radius, `44px` height (Desktop/Touch), padding `10px 20px`. Hover shifts to `#991B1B`, active to `#7F1D1D`. Focus ring uses `3px` outline of `#FEE2E2`.
- **Secondary:** Border `1.5px solid #CBD5E1` on `#FFFFFF` surface, text `#1F2937`. Hover shifts to `#F1F5F9` background and `#B91C1C` border.
- **Tertiary / Ghost:** Transparent background, text `#B91C1C` or `#475569`, hover `#FEF2F2`.
- **Destructive:** Background `#DC2626`, text `#FFFFFF`.

### Cards & Worksheets
- **Default Card:** Surface `#FFFFFF`, border `1px solid #E2E8F0`, radius `16px`, padding `24px`, ambient shadow `0 1px 3px rgba(15, 23, 42, 0.04)`.
- **Exercise Card:** Includes top accent edge (`3px` line) colored conditionally: `#B91C1C` (Kinematics), `#F4C430` (Electromagnetism), or `#15803D` (Completed).
- **Interactive State:** Transitions smoothly (`150ms ease-in-out`) to hover shadow `0 6px 20px rgba(15, 23, 42, 0.08)`.

### Input Fields & Controls
- **Text Inputs:** Height `44px`, radius `10px`, border `1px solid #CBD5E1`, background `#FFFFFF`, text `#1F2937`. Active focus sets border to `#B91C1C` and applies a `0 0 0 3px #FEE2E2` shadow glow.
- **Checkboxes & Radios:** `18px` width/height, `4px` radius for checkboxes, `50%` for radios. Checked state fills `#B91C1C` with white icon; unselected states use `#CBD5E1` borders.

### Badges & Status Indicators
- **Category Badge:** Height `24px`, padding `2px 8px`, radius `6px`, font size `12px`, weight `600`.
- **Status Variants:**
  - *Completed*: Background `#DCFCE7`, text `#15803D`.
  - *Pending / In Progress*: Background `#FEF3C7`, text `#B45309`.
  - *Required / Overdue*: Background `#FEE2E2`, text `#B91C1C`.
  - *Neutral Topic*: Background `#F1F5F9`, text `#475569`.

### Specialized Academic Components
- **Formula Highlight Callout:** Radius `12px`, background `#FEF2F2`, left border `4px solid #B91C1C`, padding `16px 20px`. Renders centered LaTeX equations with distinct copy/bookmark utilities.
- **Module Progress Bar:** Track height `8px`, radius `999px`, background `#E2E8F0`. Indicator filled with `#B91C1C` transitioning to `#F4C430` at 100% mastery.
- **Interactive Question Step:** Split container with question context on left and multiple-choice or calculation inputs on right; verified steps toggle to green (`#15803D`) border hints with explicit scientific solution reasoning panels.