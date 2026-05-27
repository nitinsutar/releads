import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        stone: "#64748b",
        brand: {
          50: "#eef8f5",
          100: "#d8eee7",
          500: "#198a70",
          600: "#08745c",
          700: "#075d4c"
        },
        gold: "#c49a52"
      },
      boxShadow: {
        card: "0 8px 30px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
