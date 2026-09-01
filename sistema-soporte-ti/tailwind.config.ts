import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce7ff",
          200: "#b9d0ff",
          300: "#8bb0ff",
          400: "#5c8cf5",
          500: "#3868e8",
          600: "#2148d6",
          700: "#1a37b0",
          800: "#16297e",
          900: "#0f1a52",
          950: "#0a1440",
        },
      },
      backgroundImage: {
        "voz-hero": "radial-gradient(120% 140% at 15% 0%, #1a37b0 0%, #0f1a52 55%, #0a1440 100%)",
        "voz-dots":
          "radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1.5px)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-delay": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delay": "float-delay 7.5s ease-in-out infinite 1s",
      },
    },
  },
  plugins: [],
};

export default config;
