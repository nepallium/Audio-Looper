/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          dark: "var(--bg-color)", // #242933
          light: "var(--text-color)", // #d8dee9
        },
        primary: {
          100: "var(--main-color)", // #88c0d0
          200: "var(--sub-color)", // #929aaa
          // 300: "var(--sub-alt-color)", // #2e3440
          400: "var(--caret-color)", // #eceff4
        },
        surface: {
          100: "var(--bg-color)", // #242933
          200: "var(--sub-alt-color)", // #2e3440
          300: "rgb(var(--sub-color) / <alpha-value>)", // #929aaa
          400: "var(--text-color)", // #d8dee9
        },
        error: {
          DEFAULT: "var(--error-color)", // #bf616a
          extra: "var(--error-extra-color)", // #793e44
        },
      },
    },
  },
  plugins: [],
};
