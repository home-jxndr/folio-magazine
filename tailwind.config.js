const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-2": "var(--paper-2)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        rule: "var(--rule)",
        accent: "var(--accent)",
        moss: "var(--moss)",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: { kicker: "0.18em", wide2: "0.24em" },
      maxWidth: { sheet: "1440px", reading: "68ch" },
      transitionTimingFunction: { editorial: "cubic-bezier(0.22, 1, 0.36, 1)" },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        rise: { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fade: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        rise: "rise 0.7s cubic-bezier(0.22,1,0.36,1) both",
        fade: "fade 0.6s ease both",
      },
    },
  },
  plugins: [],
};
export default config;