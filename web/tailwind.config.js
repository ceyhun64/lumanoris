/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
    './src/widgets/**/*.{js,jsx}',
    './src/features/**/*.{js,jsx}',
    './src/entities/**/*.{js,jsx}',
    './src/shared/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        /* ── Lumanoris Elite palette ── */
        luma: {
          base:     '#09090F',
          elevated: '#0D0D1A',
          card:     '#111120',
          panel:    '#161630',
          input:    '#0F0F22',
          hover:    'rgba(99,102,241,0.07)',
          // WCAG AA-safe (≥4.5:1 on #09090F) small-text alternative to the
          // free-floating text-white/38..45 opacity classes used throughout.
          muted:    'rgba(255,255,255,0.58)',
        },
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT:    "#10B981",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT:    "#F59E0B",
          foreground: "#ffffff",
        },
        info: {
          DEFAULT:    "#06B6D4",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans:      ["Public Sans", "sans-serif"],
        display:   ["Space Grotesk", "sans-serif"],
      },
      /* Named scale for new/touched components — replaces ad-hoc text-[Npx]
         arbitrary values (260+ distinct uses in the codebase) with a single
         source of truth. Sized to the values already dominant in the UI. */
      fontSize: {
        'caption':  ['11px', { lineHeight: '1.4' }],
        'label':    ['12px', { lineHeight: '1.4', letterSpacing: '.02em' }],
        'body-sm':  ['13px', { lineHeight: '1.55' }],
        'body':     ['14px', { lineHeight: '1.6' }],
        'body-lg':  ['15px', { lineHeight: '1.6' }],
        'title-sm': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'title':    ['20px', { lineHeight: '1.3', fontWeight: '700' }],
        'title-lg': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      backgroundImage: {
        /* Lumanoris Elite palette — Fuchsia + Violet (rebranded from indigo/cyan) */
        'gradient-luma': 'linear-gradient(135deg, #E879F9 0%, #A78BFA 100%)',
        'gradient-btn':  'linear-gradient(135deg, #C026D3 0%, #7C3AED 100%)',
        'gradient-card': 'linear-gradient(160deg, #111120 0%, #0D0D1A 100%)',
      },
      boxShadow: {
        'xs':          '0 1px 2px rgba(0,0,0,0.20)',
        'sm':          '0 2px 6px rgba(0,0,0,0.22)',
        'glow':        '0 4px 24px rgba(217,70,239,0.32)',
        'glow-cyan':   '0 4px 24px rgba(139,92,246,0.25)',
        'glow-lg':     '0 8px 32px rgba(217,70,239,0.25)',
        'card':        '0 2px 8px rgba(0,0,0,0.24)',
        'modal':       '0 20px 50px rgba(0,0,0,0.50)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fadeIn 0.25s ease-out",
        "slide-up":       "slideUp 0.3s ease-out",
        "scale-in":       "scaleIn 0.15s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
