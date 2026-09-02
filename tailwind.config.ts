import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"]
      },
      colors: {
        paper: "#F4F1EA",
        ink: "#12231F",
        mist: "#E7EEEA",
        brand: {
          50: "#E8F6F1",
          100: "#C6E9DC",
          200: "#96D4C0",
          400: "#2BA984",
          500: "#0F8F6E",
          600: "#0B7459",
          700: "#085C48",
          800: "#0A3D32"
        },
        coral: {
          50: "#FFF1EC",
          100: "#FFD9CC",
          500: "#E25B3A",
          600: "#C4472B"
        },
        sun: {
          50: "#FFF6E5",
          100: "#FFE4B3",
          500: "#E3A008",
          600: "#C48404"
        },
        lilac: {
          50: "#F3EFFB",
          100: "#E0D6F5",
          500: "#7A5AF8",
          600: "#6941E8"
        },
        sky: {
          50: "#EAF6FF",
          100: "#CDE8FB",
          500: "#2B7BBF",
          600: "#1D649E"
        },
        whatsapp: "#128C7E",
        gold: "#C49A52"
      },
      boxShadow: {
        card: "0 10px 30px rgba(18, 35, 31, 0.06)",
        lift: "0 16px 40px rgba(18, 35, 31, 0.10)"
      },
      borderRadius: {
        "2.5xl": "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
