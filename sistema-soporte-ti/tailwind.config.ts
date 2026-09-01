import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b3ccff",
          300: "#84acff",
          400: "#5586ff",
          500: "#2f63f5",
          600: "#1f49d1",
          700: "#1a3aa8",
          800: "#182f80",
          900: "#162966",
        },
      },
    },
  },
  plugins: [],
};

export default config;
