# Ease Me — Design System Specification (`DESIGN.md`)

*Established via `ui-design-architect` skill on 2026-10-30.*

---

## 1. Application Archetype & Density
- **Archetype**: High-Density Financial & Retail Operations System (OS).
- **Core Purpose**: Real-time cash flow control, weighted average cost (WAC) inventory tracking, POS checkout, staff permissions, and credit debt recovery for retail merchants.
- **Density**: High-Density Compact.
  - Base font size: `12px - 13px` for body/data, `14px` for card titles, `20px` for view titles.
  - Spacing grid: Strict `4px` / `8px` increments (`p-2`, `p-3`, `p-4`, `gap-2`, `gap-3`).
  - Maximum data visibility per screen viewport; zero excessive empty whitespace or oversized filler components.

---

## 2. Layout Shell: Collapsible Sidebar + Sticky Command Strip
- **Navigation Shell**:
  - Left collapsible sidebar (expanded: `w-64`, collapsed: `w-20`).
  - Seamless 1px solid border (`border-slate-200/90`).
  - Grouped accordion menu items with clean 18px icons, zero glowing active backgrounds. Active state: subtle `bg-orange-50/80 text-orange-700 font-semibold`.
- **Top Command Strip (Sticky Header)**:
  - Height: `h-14` (56px) sticky header with subtle bottom border.
  - Displays: Current Store / Outlet Name, Live DB status badge, Register Shift status (with 8px green/amber status pip), and quick-action buttons.
  - Immediate quick action CTAs: `+ Restock`, `+ Expense`, and `New Sale`.

---

## 3. Color Token System (60-30-10 Allocation)
Strictly adheres to the **Industrial Ledger — Crisp Light** direction:

| Role | Percentage | Token / Value | Usage |
| :--- | :--- | :--- | :--- |
| **Neutral Surface** | **60%** | `#F8FAFC` (Slate-50) & `#FFFFFF` | Canvas background, card surface backgrounds, dialog bodies. |
| **Structural & Type** | **30%** | `#0F172A` (Slate-900), `#475569` (Slate-600), `#E2E8F0` (Slate-200) | Primary text, secondary labels, table headers, 1px solid structural borders. |
| **Primary Accent** | **10%** | `#EA580C` (International Orange) | **Strictly reserved** for primary interactive CTAs, selected tabs, and active state highlights. |

### Semantic Indicators (8px Pips & Micro Badges Only)
Semantic colors are **never** used as full card background washes. They are only applied to 8px indicator dots or muted badge pills:
- **Positive / Inflow**: Emerald (`#10B981` / `bg-emerald-500`) — Cash In Drawer, Paid Sales, Stock in Green.
- **Warning / Pending**: Amber (`#F59E0B` / `bg-amber-500`) — Low Stock Reorder Threshold, Register Shift Locked.
- **Obligation / Exposure**: Rose/Red (`#EF4444` / `bg-red-500`) — Customer Receivables / Overdue Debt, Supplier Debts, Expenses.
- **Digital / Bank**: Blue/Indigo (`#3B82F6` / `bg-blue-500`) — Digital Bank Collections & Transfers.

---

## 4. Typography & Monospace Discipline
- **Primary UI Sans**: Inter (`var(--font-inter)`).
  - Used for navigation, headers, button labels, and descriptions.
  - Tight tracking: `tracking-tight` (-0.015em).
- **Financial Monospace**: JetBrains Mono (`var(--font-mono)`).
  - Used for currency amounts (`₦`), quantities, SKUs (`MED-001`), transaction codes (`ORD-9014`), and dates.
- **Tabular Figures Rule**:
  - Every financial metric and numerical table cell MUST have `tabular-nums` and `text-right` alignment.
  - Column alignment in all tables: Text is left-aligned; Numbers, prices, and quantities are strictly right-aligned with monospace figures.

---

## 5. Component Standards & Anti-Slop Guardrails
- **Borders over Shadows**:
  - Cards use `border border-slate-200/90` and `bg-white`.
  - Ban `shadow-lg`, `shadow-xl`, and `shadow-2xl` on content cards. Maximum shadow allowed is `shadow-xs` (`0 1px 2px 0 rgba(0,0,0,0.03)`).
- **Restrained Corner Radii**:
  - Cards, tables, and modal containers: `rounded-lg` (8px).
  - Inputs, badges, and buttons: `rounded-md` (6px).
  - Avatar / status indicators: `rounded-full`.
- **Zero Unrequested Gradients**:
  - No linear or radial gradient card backgrounds.
  - No multi-colored text fills (`bg-clip-text`).
  - No decorative blurred floating circles (`blur-3xl`).
- **No Card-in-Card Nesting**:
  - Inner card content is separated using subtle 1px dividers (`divide-y divide-slate-100`) or clean whitespace, never nested bordered boxes.
- **No Rainbow KPI Strips**:
  - All KPI cards share identical white card surfaces. Distinctions are communicated via crisp typography, micro status dots, and trend icons.

