import type { Config } from "tailwindcss";

/**
 * CredLink design tokens. Every value resolves to a CSS variable declared in
 * app/globals.css, so the palette, type scale and shape system have one source of truth.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "var(--ink-950)",
          800: "var(--ink-800)",
          600: "var(--ink-600)",
          500: "var(--ink-500)",
          400: "var(--ink-400)",
        },
        paper: {
          0: "var(--paper-0)",
          50: "var(--paper-50)",
          100: "var(--paper-100)",
          200: "var(--paper-200)",
        },
        line: {
          200: "var(--line-200)",
          300: "var(--line-300)",
        },
        forest: {
          950: "var(--forest-950)",
          900: "var(--forest-900)",
          800: "var(--forest-800)",
          700: "var(--forest-700)",
          600: "var(--forest-600)",
          300: "var(--forest-300)",
          100: "var(--forest-100)",
          50: "var(--forest-50)",
        },
        celadon: {
          100: "var(--celadon-100)",
          200: "var(--celadon-200)",
          300: "var(--celadon-300)",
        },
        success: { 700: "var(--success-700)", 100: "var(--success-100)", 50: "var(--success-50)" },
        warning: { 700: "var(--warning-700)", 100: "var(--warning-100)", 50: "var(--warning-50)" },
        danger: { 700: "var(--danger-700)", 100: "var(--danger-100)", 50: "var(--danger-50)" },
        info: { 700: "var(--info-700)", 100: "var(--info-100)", 50: "var(--info-50)" },
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        serif: "var(--font-serif)",
        mono: "var(--font-mono)",
      },
      fontSize: {
        micro: ["var(--fs-micro)", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        ui: ["var(--fs-ui)", { lineHeight: "1.45" }],
        body: ["var(--fs-body)", { lineHeight: "1.6" }],
        "body-lg": ["var(--fs-body-lg)", { lineHeight: "1.55" }],
        h4: ["var(--fs-h4)", { lineHeight: "1.3" }],
        h3: ["var(--fs-h3)", { lineHeight: "1.18" }],
        h2: ["var(--fs-h2)", { lineHeight: "1.08", letterSpacing: "-0.028em" }],
        h1: ["var(--fs-h1)", { lineHeight: "1.04", letterSpacing: "-0.034em" }],
        "display-l": ["var(--fs-display-l)", { lineHeight: "1.02", letterSpacing: "-0.04em" }],
        "display-xl": ["var(--fs-display-xl)", { lineHeight: "0.98", letterSpacing: "-0.045em" }],
      },
      borderRadius: {
        control: "8px",
        panel: "12px",
        surface: "16px",
        stage: "20px",
        editorial: "28px",
      },
      boxShadow: {
        hairline: "0 1px 0 0 var(--line-200)",
        raised: "0 1px 2px rgba(16,45,36,0.05), 0 10px 26px -16px rgba(16,45,36,0.28)",
        artifact: "0 2px 4px rgba(16,45,36,0.05), 0 28px 60px -30px rgba(16,45,36,0.45)",
        overlay: "0 28px 72px -28px rgba(16,45,36,0.40), 0 2px 8px rgba(16,45,36,0.06)",
        focus: "var(--focus-ring)",
      },
      transitionTimingFunction: {
        settle: "cubic-bezier(0.22, 1, 0.36, 1)",
        entrance: "cubic-bezier(0.16, 0.84, 0.44, 1)",
      },
      maxWidth: {
        prose: "66ch",
        editorial: "1240px",
        app: "1480px",
        measure: "34ch",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
    },
  },
  plugins: [],
};

export default config;