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
        // Ramo derivado del color real del isotipo VOZ360 (#0A79E8).
        brand: {
          50: "#ebf5fe",
          100: "#d8ebfd",
          200: "#acd4fb",
          300: "#76b8f9",
          400: "#3b99f7",
          500: "#0a79e8",
          600: "#0866c4",
          700: "#064c93",
          800: "#043362",
          900: "#032140",
          950: "#021427",
        },
      },
      backgroundImage: {
        // Se usan juntos en las secciones "hero" (.voz-hero + .voz-dots en
        // globals.css): el gradiente da el fondo navy, los puntos son una
        // textura sutil encima. Ambos deben usar tonos brand-800/900/950
        // para que combinen si se cambia la paleta.
        "voz-hero": "radial-gradient(120% 140% at 15% 0%, #064c93 0%, #032140 55%, #021427 100%)",
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
