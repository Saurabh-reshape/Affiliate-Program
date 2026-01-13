/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "media", // Uses prefers-color-scheme
  theme: {
    extend: {
      colors: {
        // Brand Colors
        brand: {
          DEFAULT: "var(--brand-primary)",
          hover: "var(--brand-primary-hover)",
          text: "var(--brand-text-on-primary)",
        },

        // Semantic Application Colors
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-tertiary": "var(--bg-tertiary)",

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",

        "border-primary": "var(--border-primary)",
        "border-secondary": "var(--border-secondary)",
        "border-highlight": "var(--border-highlight)",

        // Functional Colors
        success: "var(--success-green)",
        error: "var(--error-red)",
      },
      boxShadow: {
        primary: "var(--shadow-primary)",
        secondary: "var(--shadow-secondary)",
        glow: "var(--shadow-glow)",
        "glow-hover": "var(--shadow-glow-hover)",
      },
    },
  },
  plugins: [],
};
