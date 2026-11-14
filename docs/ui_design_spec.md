# Ease Me — Standardized UI Design System & Typographic Specification

## 1. Design System Philosophy
Ease Me is built for fast readability, effortless daily operations, and high-trust financial clarity.
Typography is scaled up from micro-text to comfortable, ergonomic desktop sizes. No essential text is smaller than 12px (`text-xs`).
Product titles and primary row keys are visibly distinguished from standard body copy and metadata.

---

## 2. Standardized Typographic Scale

| Level | Tailwind Class | Size / Line-Height | Weight & Tracking | Target Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| **Hero / Balance** | `text-4xl font-black` | 36px / 1.15 | Black/ExtraBold, `-0.025em`, `tabular-nums` | Major KPI card figures (`₦412,000`, `₦285,000`) |
| **Page Title (H1)** | `text-2xl font-extrabold` | 26px / 1.25 | ExtraBold, `-0.02em` | Main View Titles ("Executive Control Dashboard") |
| **Section Title (H2)** | `text-xl font-bold` | 20px / 1.3 | Bold, `-0.015em` | Section headers, major sub-view headers |
| **Card / Modal Header (H3)** | `text-lg font-bold` | 18px / 1.35 | Bold, `-0.01em` | Modal titles, Card titles, Chart titles |
| **Product / Entity Title** | `text-base font-bold` | 16px / 1.35 | Bold (`text-slate-900`) | Product names, Customer names, Supplier names |
| **Standard Body / Form** | `text-sm font-medium` | 14px / 1.4 | Medium (`text-slate-700`) | Form inputs, Selects, Table data cells |
| **Sidebar Parent Header** | `text-[15px] font-bold` | 15px / 1.35 | Bold (`text-slate-800`) | Sidebar Category Headers |
| **Sidebar Submenu Item** | `text-sm font-medium` | 14px / 1.35 | Medium (`text-slate-600`) | Child sidebar links with dedicated 16px icons |
| **Helper / Timestamps / SKUs** | `text-xs font-normal` | 12px / 1.4 | Regular/Medium (`text-slate-500`) | Timestamps, Categories, Reorder stock thresholds |

---

## 3. Color Token System

### 3.1 Primary Solid-Filled KPI Balance Cards
- **Total Revenue**: `bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm`
- **Est. Net Profit**: `bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm`
- **Cash in Drawer**: `bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm`
- **Customer Debts**: `bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-sm`

### 3.2 Navigation & Surface Tones
- **Sidebar Background**: `bg-white/95 backdrop-blur-md border-r border-slate-200/80`
- **Parent Menu Item**: `text-[15px] font-bold text-slate-800 hover:text-slate-950 hover:bg-slate-100/70`
- **Submenu Item**: `text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/60`
- **Active Navigation Pill**: `bg-orange-50 text-orange-700 font-semibold shadow-xs`
- **Glass Card**: `bg-white/85 backdrop-blur-md border border-slate-200/85 shadow-xs`

---

## 4. Iconography Standards
- **Parent Menus**: 18px icons (`size={18}`) in dark slate (`text-slate-700`).
- **Submenu Items**: 16px dedicated icons (`size={16}`) with context colors.
- **Table Actions / Buttons**: 15px-16px icons (`size={15}`).
