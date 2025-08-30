// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        scan: "scan 2s infinite ease-in-out",
      },
      keyframes: {
        scan: {
          "0%": { top: "0%" },
          "50%": { top: "100%" },
          "100%": { top: "0%" },
        },
      },
    },
  },
  plugins: [],
};
