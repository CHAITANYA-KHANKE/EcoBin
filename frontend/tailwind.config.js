/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: "#080c14",
        panelbg: "rgba(13, 20, 35, 0.65)",
        glassborder: "rgba(255, 255, 255, 0.06)",
        accentgreen: "#10b981",
        accentcyan: "#06b6d4",
        accentred: "#f43f5e",
        accentyellow: "#eab308"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"]
      },
      boxShadow: {
        neon: "0 0 15px rgba(6, 182, 212, 0.2)",
        neongreen: "0 0 15px rgba(16, 185, 129, 0.2)"
      }
    },
  },
  plugins: [],
}
