/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          dark: "var(--clr-dark-a0)",
          light: "var(--clr-light-a0)",
        },
        primary: {
          100: "var(--clr-primary-a0)",
          200: "var(--clr-primary-a10)",
          300: "var(--clr-primary-a20)",
          400: "var(--clr-primary-a30)",
          500: "var(--clr-primary-a40)",
          600: "var(--clr-primary-a50)",
        },
        surface: {
          100: "var(--clr-surface-a0)",
          200: "var(--clr-surface-a10)",
          300: "var(--clr-surface-a20)",
          400: "var(--clr-surface-a30)",
          500: "var(--clr-surface-a40)",
          600: "var(--clr-surface-a50)",
        },
        tonal: {
          100: "var(--clr-surface-tonal-a0)",
          200: "var(--clr-surface-tonal-a10)",
          300: "var(--clr-surface-tonal-a20)",
          400: "var(--clr-surface-tonal-a30)",
          500: "var(--clr-surface-tonal-a40)",
          600: "var(--clr-surface-tonal-a50)",
        },
        success: {
          100: "var(--clr-success-a0)",
          200: "var(--clr-success-a10)",
          300: "var(--clr-success-a20)",
        },
        warning: {
          100: "var(--clr-warning-a0)",
          200: "var(--clr-warning-a10)",
          300: "var(--clr-warning-a20)",
        },
        danger: {
          100: "var(--clr-danger-a0)",
          200: "var(--clr-danger-a10)",
          300: "var(--clr-danger-a20)",
        },
        info: {
          100: "var(--clr-info-a0)",
          200: "var(--clr-info-a10)",
          300: "var(--clr-info-a20)",
        },
      },
    },
  },
  plugins: [],
};
