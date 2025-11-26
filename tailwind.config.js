// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // Semantic Color System with CSS Variables
      colors: {
        // Semantic color tokens that adapt to light/dark mode
        background: {
          DEFAULT: "var(--color-background)",
          secondary: "var(--color-background-secondary)",
          tertiary: "var(--color-background-tertiary)",
          accent: "var(--color-background-accent)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          elevated: "var(--color-surface-elevated)",
          overlay: "var(--color-surface-overlay)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          subtle: "var(--color-border-subtle)",
          strong: "var(--color-border-strong)",
        },
        // === UNIFIED COLOR SYSTEM ===
        // All colors use CSS variables for theme-aware behavior
        // Single source of truth - no duplication

        // Primary brand colors
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          active: "var(--color-primary-active)",
          muted: "var(--color-primary-muted)",
        },

        // Semantic status colors
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
      },
      // Typography from Design Manual
      fontFamily: {
        sora: ["Sora", "sans-serif"], // Primary headings
        poppins: ["Poppins", "sans-serif"], // Body text
      },
      // Add smooth scrolling utilities
      scrollBehavior: {
        smooth: "smooth",
        auto: "auto",
      },
      // Enhanced gradients for modern UI - Based on OpenPrime Design Manual
      backgroundImage: {
        "openprime-gradient": "linear-gradient(135deg, #04312C 0%, #00E081 100%)",
        "openprime-teal-gradient": "linear-gradient(135deg, #35B0A0 0%, #37D8A9 100%)",
        "openprime-primary-gradient": "linear-gradient(135deg, #04312C 0%, #35B0A0 100%)",
        "openprime-accent-gradient": "linear-gradient(135deg, #00E081 0%, #60EFFF 100%)",
        "surface-gradient":
          "linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-elevated) 100%)",
      },
      // Box shadows for elevation system
      boxShadow: {
        "elevation-1": "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
        "elevation-2": "0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)",
        "elevation-3": "0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)",
        "elevation-4": "0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
      // Animation utilities
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      // Z-index scale extension for layered UI components
      // 50: modals, dropdowns (Tailwind default)
      // 60: floating UI (chat button/window)
      // 70: toast notifications (always on top)
      zIndex: {
        60: "60",
        70: "70",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const semanticUtilities = {
        // === TEXT UTILITIES ===
        // Semantic text colors (Note: .text-primary intentionally overrides brand primary for semantic text)
        ".text-primary": { color: "var(--color-text-primary)" },
        ".text-secondary": { color: "var(--color-text-secondary)" },
        ".text-tertiary": { color: "var(--color-text-tertiary)" },
        ".text-inverse": { color: "var(--color-text-inverse)" },
        // Status text colors
        ".text-success": { color: "var(--color-success)" },
        ".text-warning": { color: "var(--color-warning)" },
        ".text-danger": { color: "var(--color-danger)" },
        ".text-info": { color: "var(--color-info)" },

        // === BACKGROUND UTILITIES ===
        // Background variants
        ".bg-background-secondary": {
          backgroundColor: "var(--color-background-secondary)",
        },
        ".bg-background-tertiary": {
          backgroundColor: "var(--color-background-tertiary)",
        },
        ".bg-background-accent": {
          backgroundColor: "var(--color-background-accent)",
        },
        // Surface variants
        ".bg-surface-elevated": {
          backgroundColor: "var(--color-surface-elevated)",
        },
        ".bg-surface-overlay": {
          backgroundColor: "var(--color-surface-overlay)",
        },
        // Primary variants
        ".bg-primary-hover": {
          backgroundColor: "var(--color-primary-hover)",
        },
        ".bg-primary-active": {
          backgroundColor: "var(--color-primary-active)",
        },
        ".bg-primary-muted": {
          backgroundColor: "var(--color-primary-muted)",
        },
        // Accent variants
        ".bg-accent-hover": {
          backgroundColor: "var(--color-accent-hover)",
        },
        ".bg-accent-muted": {
          backgroundColor: "var(--color-accent-muted)",
        },
        // Status backgrounds
        ".bg-success-muted": {
          backgroundColor: "var(--color-success-muted)",
        },
        ".bg-warning-muted": {
          backgroundColor: "var(--color-warning-muted)",
        },
        ".bg-danger-muted": {
          backgroundColor: "var(--color-danger-muted)",
        },
        ".bg-info-muted": {
          backgroundColor: "var(--color-info-muted)",
        },

        // === BORDER UTILITIES ===
        ".border-subtle": { borderColor: "var(--color-border-subtle)" },
        ".border-strong": { borderColor: "var(--color-border-strong)" },

        // === SEMANTIC BORDER UTILITIES ===
        ".border-l-success": {
          borderLeftColor: "var(--color-success)",
        },
        ".border-l-danger": { borderLeftColor: "var(--color-danger)" },
        ".border-l-warning": {
          borderLeftColor: "var(--color-warning)",
        },
        ".border-l-info": { borderLeftColor: "var(--color-info)" },
        ".border-t-surface": { borderTopColor: "var(--color-surface)" },
      };

      addUtilities(semanticUtilities, {
        respectPrefix: false,
        respectImportant: false,
      });
    },
  ],
};
