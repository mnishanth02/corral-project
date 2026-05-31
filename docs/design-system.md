/* ==========================================================================
   CORRAL — Design System Tokens (Tailwind CSS v4 + shadcn/ui)
   --------------------------------------------------------------------------
   Two products, one backbone:
     • Light theme (:root)  -> Participant app (B2C) + Organizer light dashboard
     • Dark theme  (.dark)  -> Race-day command center (glare-reduced, alerts pop)
     • Sidebar tokens       -> Always-navy organizer nav (independent of theme)

   Dependencies (Vite + Tailwind v4):
     pnpm add tailwindcss @tailwindcss/vite tw-animate-css
     (wire the @tailwindcss/vite plugin in vite.config.ts; tw-animate-css
      replaces the deprecated tailwindcss-animate)

   Fonts:
     Self-host fonts in the scaffold; do not use Google Fonts @import in shipped
     CSS. Install font packages (for example @fontsource-variable/inter and an
     Oswald font package) or add local woff2 files + @font-face in the app/UI
     package. English-only for MVP — Tamil (Noto Sans Tamil) is deferred; see
     --font-sans below for where to re-add it.

   ACCESSIBILITY NOTES (see also the design review):
     • Brand fills (orange/amber/emerald/red) FAIL AA as text on light.
       Use the *-text / brand-orange-strong tokens when the color is TEXT.
     • Never encode state by color alone (SOS red / verified green) — always
       pair semantic color with an icon, shape, or label. CVD safety.
     • white-on-orange ~3.1:1 (large/bold only). Consider dark text on small
       orange controls (navy-on-orange ~5.6:1).
   ========================================================================== */

/* English-only for MVP. Import self-hosted font CSS before this file in each app
  or define local @font-face rules here. To re-enable Tamil later, add a
  self-hosted Noto Sans Tamil source and put "Noto Sans Tamil" before sans-serif
  in --font-sans below. */

@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* ==========================================================================
   1. LIGHT THEME — Participant app + Organizer light dashboard
   ========================================================================== */
:root {
  --radius: 0.5rem;

  /* Core surfaces */
  --background: #f8fafc;          /* Track Gray — easier on eyes for dense tables */
  --foreground: #0f172a;          /* Command Navy — primary text, strong contrast */

  --card: #ffffff;
  --card-foreground: #0f172a;

  --popover: #ffffff;
  --popover-foreground: #0f172a;

  /* Primary action — Corral Orange */
  --primary: #ff5a00;
  --primary-foreground: #ffffff;  /* large/bold only; see notes */

  /* Secondary / muted / accent (kept neutral for calm B2B tables) */
  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;
  --muted: #f1f5f9;
  --muted-foreground: #475569;    /* darker than shadcn default — sunlight legibility */
  --accent: #f1f5f9;
  --accent-foreground: #0f172a;

  /* Destructive (maps to danger) */
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;

  /* Lines & focus */
  --border: #e2e8f0;
  --input: #cbd5e1;               /* slightly stronger so fields are visible outdoors */
  --ring: #ff5a00;                /* brand-orange focus ring */

  /* ---- Extended semantic states (fills) ---- */
  --success: #10b981;             /* Emerald — PBs, verified */
  --success-foreground: #ffffff;
  --warning: #f59e0b;             /* Amber — missing permits, cutoffs */
  --warning-foreground: #0f172a;  /* dark text on amber (~7:1) */
  --danger: #ef4444;              /* Red — SOS, medical alert */
  --danger-foreground: #ffffff;
  --info: #0ea5e9;                /* added: neutral informational state */
  --info-foreground: #ffffff;

  /* ---- Text-safe variants (use when the semantic color is TEXT on light) ---- */
  --success-text: #047857;        /* ~4.5:1+ on white */
  --warning-text: #b45309;
  --danger-text: #b91c1c;
  --info-text: #0369a1;

  /* ---- Brand tokens ---- */
  --brand-orange: #ff5a00;        /* fills, finish-line UI, big accents */
  --brand-orange-strong: #c2410c; /* text-safe orange on light (~5.2:1) */
  --brand-navy: #0f172a;
  --brand-tint: #fff1ea;          /* soft orange wash for celebratory B2C surfaces */
  --whatsapp: #25d366;            /* "Send a Cheer" / share buttons */

  /* ---- Charts (analytics, sponsor ROI). Pair with patterns for CVD safety ---- */
  --chart-1: #ff5a00;             /* orange */
  --chart-2: #2563eb;             /* blue */
  --chart-3: #10b981;             /* emerald */
  --chart-4: #f59e0b;             /* amber */
  --chart-5: #7c3aed;             /* violet */

  /* ---- Sidebar: ALWAYS navy, even inside the light dashboard ---- */
  --sidebar: #0f172a;
  --sidebar-foreground: #e2e8f0;
  --sidebar-primary: #ff5a00;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #1e293b;
  --sidebar-accent-foreground: #f8fafc;
  --sidebar-border: #1e293b;
  --sidebar-ring: #ff5a00;
}

/* ==========================================================================
   2. DARK THEME — Race-day command center
   Background deepened, alert colors brightened so Red/Amber pop under glare.
   ========================================================================== */
.dark {
  --background: #0b1120;          /* near-black navy — maximizes alert contrast */
  --foreground: #f1f5f9;

  --card: #0f172a;
  --card-foreground: #f1f5f9;

  --popover: #0f172a;
  --popover-foreground: #f1f5f9;

  --primary: #ff5a00;
  --primary-foreground: #ffffff;

  --secondary: #1e293b;
  --secondary-foreground: #f1f5f9;
  --muted: #1e293b;
  --muted-foreground: #94a3b8;
  --accent: #1e293b;
  --accent-foreground: #f1f5f9;

  --destructive: #ff4d4d;         /* brightened for command-center visibility */
  --destructive-foreground: #0b1120;

  --border: #1e293b;
  --input: #334155;
  --ring: #ff5a00;

  /* Semantic fills — brightened for dark surfaces */
  --success: #34d399;
  --success-foreground: #052e16;
  --warning: #fbbf24;
  --warning-foreground: #1f1300;
  --danger: #ff4d4d;
  --danger-foreground: #0b1120;
  --info: #38bdf8;
  --info-foreground: #082f49;

  /* Text-safe variants for dark (lighter tints read on dark) */
  --success-text: #6ee7b7;
  --warning-text: #fcd34d;
  --danger-text: #fca5a5;
  --info-text: #7dd3fc;

  /* Brand */
  --brand-orange: #ff5a00;
  --brand-orange-strong: #ff7a33; /* legible orange text on dark */
  --brand-navy: #0f172a;
  --brand-tint: #1a1206;
  --whatsapp: #25d366;

  /* Charts — brightened */
  --chart-1: #ff6b1a;
  --chart-2: #3b82f6;
  --chart-3: #34d399;
  --chart-4: #fbbf24;
  --chart-5: #a78bfa;

  /* Sidebar in dark mode */
  --sidebar: #0b1120;
  --sidebar-foreground: #e2e8f0;
  --sidebar-primary: #ff5a00;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #1e293b;
  --sidebar-accent-foreground: #f8fafc;
  --sidebar-border: #1e293b;
  --sidebar-ring: #ff5a00;
}

/* ==========================================================================
   3. THEME MAPPING — expose tokens to Tailwind utilities (@theme inline)
   Generates: bg-*, text-*, border-*, ring-*, fill-*, etc.
   ========================================================================== */
@theme inline {
  /* Fonts */
  /* English-only for MVP; re-add "Noto Sans Tamil" before sans-serif when Tamil returns. */
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-display: "Oswald", "Inter", ui-sans-serif, sans-serif;
  --font-mono: ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", monospace;

  /* Core */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Semantic states (fills) */
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-danger: var(--danger);
  --color-danger-foreground: var(--danger-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);

  /* Text-safe semantic variants */
  --color-success-text: var(--success-text);
  --color-warning-text: var(--warning-text);
  --color-danger-text: var(--danger-text);
  --color-info-text: var(--info-text);

  /* Brand */
  --color-brand-orange: var(--brand-orange);
  --color-brand-orange-strong: var(--brand-orange-strong);
  --color-brand-navy: var(--brand-navy);
  --color-brand-tint: var(--brand-tint);
  --color-whatsapp: var(--whatsapp);

  /* Charts */
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  /* Sidebar */
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* Radius scale */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* ==========================================================================
   4. BASE LAYER
   ========================================================================== */
@layer base {
  /* Tailwind v4 default border color changed to currentColor — restore tokened border */
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-border, currentColor);
  }

  * {
    outline-color: var(--color-ring);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  /* Display type — Oswald, condensed, BIB-like */
  h1, h2, h3, .font-display {
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  /* Visible, accessible focus ring for keyboard nav (critical in dense B2B tables) */
  :focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 2px;
  }
}

/* ==========================================================================
   5. UTILITIES
   ========================================================================== */
@layer utilities {
  /* Fixed-width digits — stops live race clocks / split times from jittering.
     Apply to the timer + any updating numeric stat. */
  .font-timer {
    font-family: var(--font-display);
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1;
    letter-spacing: 0.02em;
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1;
  }

  /* Uppercase BIB-style label */
  .text-bib {
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}