import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        astrabg: "#03040a",
        astraborder: "rgba(167,139,250,0.16)"
      },
      boxShadow: {
        astro: "0 20px 60px rgba(72,31,255,0.18)"
      }
    }
  },
  plugins: []
} satisfies Config;
