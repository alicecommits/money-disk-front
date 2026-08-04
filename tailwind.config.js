/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   "#0a0a0f",
          secondary: "#12121a",
          tertiary:  "#1a1a24",
          hover:     "#22222e",
        },
        accent: {
          primary:   "#7c5cff",
          secondary: "#5e5ce6",
        },
        border: {
          subtle:  "#27272a",
          default: "#3f3f46",
        },
        text: {
          primary:   "#f5f5f7",
          secondary: "#a1a1aa",
          tertiary:  "#71717a",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
