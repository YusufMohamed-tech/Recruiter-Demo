# Chessboard Group — Branding Guidelines

> Extracted from the official website: [chessboard-group.com](https://chessboard-group.com)

---

## 1. Brand Identity

| Attribute       | Value                                                                                 |
| --------------- | ------------------------------------------------------------------------------------- |
| **Full Name**   | Chessboard Group                                                                      |
| **Short Name**  | Chessboard                                                                            |
| **Tagline**     | Direct Sales in KSA                                                                   |
| **Description** | Accelerates and streamlines your hiring and sales processes, with over a decade of proven expertise in business management and human resources. |
| **Market**      | Kingdom of Saudi Arabia (KSA)                                                         |
| **Website**     | https://chessboard-group.com                                                          |

---

## 2. Logo

| Property          | Value                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Logo file**     | `cropped-chess-board-logo.avif`                                                                                     |
| **Logo URL**      | https://chessboard-group.com/wp-content/uploads/2025/04/cropped-chess-board-logo.avif                               |
| **Dimensions**    | 375 × 103 px (landscape / horizontal lockup)                                                                        |
| **Usage**         | Appears on white/light backgrounds in the header; always maintain clear space around the logo equal to the logo height |
| **Image radius**  | 25px (used on imagery and card thumbnails sitewide)                                                                 |

---

## 3. Color Palette

### Primary Brand Colors

| Role              | Hex       | Usage                                                     |
| ----------------- | --------- | --------------------------------------------------------- |
| **Brand Green**   | `#BBD42F` | Primary accent — CTA buttons, counter numbers, icon hover states, active nav links, highlight text |
| **Brand Green Alt** | `#C9F31D` | Hover/interaction variant of the brand green            |
| **Dark / Black**  | `#010101` | Secondary — page backgrounds (dark sections), strong text contrast |
| **Off-White**     | `#FFFFFF` / `#FFFFFFFC` | Primary background for light sections      |
| **Light Gray BG** | `#F2F2F2` | Service card background (default/inactive state)          |

### Neutral / Text Colors

| Role               | Hex       | Usage                                          |
| ------------------ | --------- | ---------------------------------------------- |
| **Body Text**      | `#919396` | All body copy, subtitles, counter labels, default icon color |
| **Secondary Text** | `#7A7A7A` | Elementor global text color                    |
| **Heading Default**| `#54595F` | Elementor global secondary                     |

### System / Link Colors (CSS Variables)

```css
:root {
  --primary-color:        #FF3D00;   /* legacy/accent */
  --secondary-color:      #010101;   /* dark base */
  --third-color:          #00c5fe;
  --body-bg-color:        #fff;
  --link-color:           #1F1F1F;
  --link-color-hover:     #F14F44;
  --link-color-active:    #F14F44;
  --gradient-color-from:  #6000ff;
  --gradient-color-to:    #fe0054;
}
```

### Color Usage Rules

- **Brand Green `#BBD42F`** is the single dominant accent color — use it for:
  - Primary CTA button backgrounds
  - Active / hover states on navigation links
  - Stat/counter number highlights
  - Icon hover and active states
  - Text highlights / callouts within headings
- **Dark `#010101`** is used for high-contrast dark section backgrounds (hero, feature panels)
- **`#919396`** is the default neutral for all supporting text and non-active UI elements
- Service cards use `#F2F2F2` as their default background, switching to `#919396` on active/hover

---

## 4. Typography

### Font Stack

| Role                 | Font Family          | Weights Used   | Notes                                    |
| -------------------- | -------------------- | -------------- | ---------------------------------------- |
| **Primary Body**     | `Poppins`            | 300, 400, 800  | Default LTR body font sitewide           |
| **Arabic Body**      | `IBM Plex Sans Arabic` | 400          | Applied to Arabic (`lang="ar"`) text     |
| **Heading / Display**| `Sora`               | varies         | CSS variable `--heading-font`            |
| **Navigation**       | `Kanit`              | 400            | Nav menu links, sub-menu items, 17px     |
| **Secondary**        | `Montserrat`         | 400            | CSS variable `--secondary-font`          |
| **Counters / Labels**| `Poppins`            | 300, 400       | Stats section labels                     |

> All icon fonts (`eicons`, `dashicons`, Font Awesome) inherit their own families and must not be overridden.

### Type Scale (observed)

| Element          | Font           | Size   | Weight | Line Height | Letter Spacing |
| ---------------- | -------------- | ------ | ------ | ----------- | -------------- |
| Body copy        | Poppins        | 22px   | 300    | 1.364       | –0.44px        |
| Navigation items | Kanit          | 17px   | 400    | —           | —              |
| Sub-menu items   | Kanit          | 17px   | 400    | —           | —              |
| Counter numbers  | (inherits)     | —      | —      | —           | —              |
| Section labels   | Poppins        | —      | 300–400| —           | —              |

### Bilingual Support

- The site supports both **English (LTR)** and **Arabic (RTL)** via `hreflang="ar"` and `hreflang="en"`.
- Arabic uses `IBM Plex Sans Arabic`; all other languages default to `Poppins`.
- Use `dir="auto"` on text containers that may switch language.

---

## 5. Iconography & Imagery

- **Icon library**: Font Awesome (via `all.min.css`) + Elementor Icons (`eicons`)
- **Imagery style**: Professional photography — teams, business environments, corporate/HR settings
- **Image corner radius**: `25px` on all cards and profile images
- **Hero/feature image**: Overlapping layout with negative margin offsets (`–150px`) for depth layering
- **SVG arrow/chevron buttons**: Arrow icons used inline in service card CTAs (17×17 px)

---

## 6. UI Components

### Buttons

| State       | Background  | Text color  | Border      |
| ----------- | ----------- | ----------- | ----------- |
| Default     | `#BBD42F`   | —           | —           |
| Hover       | —           | `#FFFFFF`   | `#FFFFFF` solid |
| Split btn   | `#919396`   | —           | —           |

- Button padding: `0px 42.5px` (horizontal)
- Border radius: rounded (pill-style on split button text sections)

### Cards (Service Cards)

- Default background: `#F2F2F2`
- Active/hover background: `#919396`
- Icon color default: `#919396`
- Icon color active/hover: `#BBD42F`
- Title color default: `#919396`
- Title color active/hover: `#BBD42F`
- Corner radius: `25px`

### Navigation

- Font: `Kanit`, 17px, weight 400
- Active link color: `#BBD42F` (dark header) / `#919396` (light header)
- Hover: underline split animation
- Mobile: collapsible hamburger menu

### Counters / Stats

- Number color: `#BBD42F`
- Prefix / Suffix color: `#BBD42F` / `#919396`
- Label color: `#919396`
- Font: `Poppins`
- Animation: draw effect, 2000ms duration

---

## 7. Layout & Spacing

| Property           | Value              |
| ------------------ | ------------------ |
| Max content width  | `1140px` (desktop) / `1024px` (tablet) / `767px` (mobile) |
| Wide layout        | `1444px` (header full-width container) |
| Section padding    | `131px` top/bottom (hero sections) |
| Widget gap         | `20px` (default)   |
| Column gap         | `30px`             |
| Row gap            | `85px`             |
| Image border-radius| `25px`             |
| Button padding     | `0 42.5px`         |

---

## 8. Sections & Content Architecture

### Navigation Menu

- Home
- About Us → `https://chessboard-group.com/about-us`
- [Services — implied submenu]
- Contact Us → `https://chessboard-group.com/contact-us`

### Hero Section

- Large headline with text animation (rotate-in Y-axis, word split)
- Stat counters row: Years Experience, Projects Delivered
- CTA button (Brand Green `#BBD42F`)

### About Us Section

- Subtitle label: `// ABOUT US`
- Body copy in Poppins 22px / 300 weight
- Overlapping image layout

### Services Section

- Section header: `OUR SERVICES`
- 7 service offerings:
  1. **Direct Selling Services** — "CHESSBOARD helps you stay ahead of the game by being up to date to the latest…"
  2. **Employer of Record (EOR)** — "With over a decade of proven expertise in business management and human resources, Chessboard proudly offers…"
  3. **Mystery Shopper Services** — "Mystery shopper services help businesses evaluate and enhance customer experience through discreet, real-life scenarios…"
  4. **Merchandising Services** — "Chessboard provides top-tier merchandising services in Saudi Arabia (KSA). We boost your brand visibility, customer engagement…"
  5. **Event Management Services** — "We create campaigns that lead to lasting connections with customers, We take into careful consideration your…"
  6. **Payroll and Medical Insurance Administration** — "CHESSBOARD helps you stay ahead of the game by being up to date to the latest…"
  7. **Inbound and Outbound Call Centers** — "Understanding the differences between inbound and outbound call centers will help you pinpoint the best practice…"

### Latest News Section

- Section header: `LATEST NEWS`

### FAQ Section

- Section header: `QUESTIONS?`

### Footer

- Logo + tagline
- Belief statement: *"We believe in your success and that sales services can help you achieve the best results for your business"*
- **Our Links** column
- **Our Location** column
- **Send Email** column
- Copyright: `© Chessboard 2026 . All rights reserved`
- Credit: Website by HOOH Creative Agency

---

## 9. Social Media Handles

| Platform   | Handle / URL                                               |
| ---------- | ---------------------------------------------------------- |
| Instagram  | [@chessboard.ksa](https://www.instagram.com/chessboard.ksa/) |
| LinkedIn   | [chessboardksa](https://www.linkedin.com/company/chessboardksa/) |
| X (Twitter)| [@Chessboardksa](https://x.com/Chessboardksa)             |

---

## 10. Motion & Animation

| Element               | Effect                               | Duration  | Stagger  |
| --------------------- | ------------------------------------ | --------- | -------- |
| Section headings       | Rotate-in Y-axis (word split)        | 1000ms    | 0ms      |
| Body copy             | Rotate-in X-axis (char/word split)   | 1000ms    | 100ms    |
| Character headings    | Slide-in BTT (char split)            | 1000ms    | 15ms     |
| Counter numbers        | Draw effect                          | 2000ms    | —        |
| Buttons               | Spotlight scale hover                | —         | —        |
| All transforms         | 3D perspective: `800px`             | —         | —        |

---

## 11. Writing Style & Tone of Voice

Based on the website copy:

- **Confident and professional** — positions the company as the expert partner, not a vendor
- **Action-oriented** — verbs like "Accelerates", "Streamlines", "Boost", "Stay ahead of the game"
- **Direct and concise** — short, punchy service descriptions; no fluff
- **Trust-building** — emphasizes "over a decade of proven expertise"
- **Client-centric** — framing around client success: "We believe in your success"
- **KSA-aware** — explicitly references Saudi Arabia context and regulations (EOR, payroll in KSA)
- Bilingual support (English + Arabic) signals inclusivity and local market commitment
- Section labels use `//` prefix decorators (e.g., `// ABOUT US`) as a stylistic design element

---

## 12. CSS Design Tokens (Quick Reference)

```css
/* Brand Colors */
--brand-green:       #BBD42F;
--brand-green-hover: #C9F31D;
--brand-dark:        #010101;
--brand-white:       #FFFFFF;
--brand-light-bg:    #F2F2F2;
--brand-neutral:     #919396;

/* Typography */
--font-body:     'Poppins', sans-serif;
--font-arabic:   'IBM Plex Sans Arabic', sans-serif;
--font-heading:  'Sora', sans-serif;
--font-nav:      'Kanit', sans-serif;
--font-secondary:'Montserrat', sans-serif;

/* Spacing */
--radius-card:   25px;
--max-width:     1140px;
--max-width-wide:1444px;
--section-pad-v: 131px;
--col-gap:       30px;
--row-gap:       85px;
--widget-gap:    20px;
```
