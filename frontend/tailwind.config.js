// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {},
      boxShadow: {
        "glow": "0 0 12px rgba(26,90,255,0.4)",
        "soft": "0 4px 12px rgba(0,0,0,0.15)"
      },
      backdropBlur: {
        "lg": "12px"
      },
      borderRadius: {
        "xl": "1.5rem" // 24px
      }
    }
  },
  plugins: []
};
