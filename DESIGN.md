---
name: Dispute Ops Performance System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-sm:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  table-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  table-cell-padding-x: 12px
  table-cell-padding-y: 8px
  drawer-width: 480px
---

## Brand & Style

The design system is engineered for high-stakes operational environments where speed of analysis and accuracy of data entry are paramount. The personality is clinical, objective, and authoritative, minimizing visual noise to reduce cognitive load during long work sessions.

The style is **Professional Minimalism**. It avoids decorative elements like gradients or blurs, favoring a "Data-First" architecture. High information density is achieved through rigorous alignment and a restrained palette, ensuring that the user's attention is directed exclusively toward case status, evidence, and decision-making workflows.

## Colors

The color palette is dominated by a neutral scale to maintain a calm, focused environment.

- **Primary:** An industrial Indigo (#2563EB) used exclusively for primary actions and active states.
- **Surface:** The background uses a clean White (#FFFFFF) with a Subtle Gray (#F8FAFC) for secondary regions like sidebars or table headers to provide structural anchoring.
- **Semantic:** High-contrast status colors are reserved for outcome indicators. "Won" cases use an emerald green, "Lost" use a ruby red, and "Fraud" alerts use a vivid amber.
- **PII display (post-core stretch):** the list shows `user_id` and `device_id` in full, but
  masks email as first-character + five asterisks + domain. Detail still shows the full supplied
  fields, while search uses unmasked values.
- **Data-quality indicator (post-core refinement):** use a compact amber outlined “Data issue”
  badge in the list. In case detail, show an amber callout with the supplied reason codes. It is
  diagnostic only and must not replace the blue/green workflow status badge.
- **Data-quality filtering:** place an “All data / Data issues only” selector beside the other
  list filters. It refines list results only; it must not be represented as a workflow status.

## Typography

This design system utilizes a tiered typography strategy to maximize legibility in dense data views.

- **Headlines:** Uses a sharp, contemporary Sans-Serif for clear section identification.
- **Body:** Standardized on a neutral, systematic font for maximum readability in multi-row tables and case descriptions.
- **Technical Data:** A monospaced font is used for PII, Transaction IDs, and Device IDs to ensure character-level clarity and easier visual scanning of alphanumeric strings.
- **Hierarchy:** Contrast is created via weight and spacing rather than size, keeping most UI text between 12px and 14px to maintain density.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Navigation and Detail Drawers occupy fixed widths, while the primary data grid expands to fill the remaining horizontal space.

- **Grid:** A compact 4px base unit drives all spacing.
- **Density:** Table rows are capped at 40px height to allow more records per viewport.
- **Detail Drawers:** Contextual information (case details) should slide in from the right, overlaying only a portion of the grid to maintain user context.
- **Margins:** Global page margins are set to 24px, but internal component spacing (between form fields) is tightened to 12px or 16px.

## Elevation & Depth

This design system utilizes **Tonal Layering** and **Low-Contrast Outlines** instead of shadows to signify depth.

- **Level 0 (Base):** The primary application canvas (#FFFFFF).
- **Level 1 (Subtle):** Used for table headers, sidebar backgrounds, and empty states (#F8FAFC).
- **Level 2 (Active/Overlay):** Modals and Drawers use a crisp 1px border (#E2E8F0) and a very subtle, large-radius shadow (15% opacity) only to separate them from the grid below.
- **Dividers:** Horizontal rules must be 1px solid and use the subtle border color to define boundaries without adding visual weight.

## Shapes

The shape language is "Soft" (4px radius). This provides a professional, modern feel while remaining efficient for button hit-areas and input fields.

- **Inputs & Buttons:** 4px border radius.
- **Status Badges:** 2px or 4px radius (never pill-shaped) to maintain the "blocky" professional aesthetic.
- **Cards/Containers:** 4px radius with a 1px solid border.

## Components

### Dense Tables
The core of the system. Headers are sticky, text-transformed to uppercase, and use a slightly darker background. Rows should feature a subtle hover state (#F1F5F9) to assist eye-tracking.

### Status Badges
Small, square-ish badges with a light tinted background and dark foreground text.
- *Example:* "Won" uses a light green background with dark green text.

### Detail Drawers
Right-aligned containers for deep-dives into a specific dispute. Drawers must include a header with the Case ID in Monospace and a "Close" button in the top right.

### Robust Form Controls
Input fields must have clearly defined focus states using the Primary color. Error messages appear immediately below the field in the "Lost" status color.

### PII Masking
The list masks email but shows the supplied `user_id` and `device_id` in full; detail shows all
three values in full. Do not add copy controls, visibility toggles, or an IP-address field.

### Subtle Charts
Line and bar charts for dispute volume should use the Primary color for the main data series and Neutral colors for comparisons. No fills or gradients under lines.

## Behavioral Boundaries

`GIC.md` and `docs/*.md` define product behavior; this document and the visual references define
visual treatment only. When they differ, the behavioral documents win.

- Render an “Acting as” dropdown for Analyst and Manager as local UI state. It changes visible
  affordances only; the backend performs no authentication or authorization and accepts write
  requests regardless of the supplied role.
- Treat “New Manual Case”, export, high-priority/flagged/archive navigation, date-range filters,
  and notification/settings controls in the screenshots as visual-reference material, not v1
  features. Do not implement them unless a behavioral requirement is added.
- Use the screenshots’ right detail drawer for the documented case-detail view, but defer its
  outcome editor to Milestone 5 and audit history to the Manager-only Milestone 5 work.
- Defer the chart and trend controls to Milestone 6. The required trend grouping is month and/or
  region, not the screenshot’s date-range behavior.
- The post-core list uses compact Previous/Next pagination with a maximum 20-row page and
  direct page-number controls, plus Month start/end, Status, Region, Apply, and Reset controls.
  The default Month range is January of the current year through the current month. Do not add
  screenshot-only date-range presets.
