// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Add smooth scrolling utilities
      scrollBehavior: {
        'smooth': 'smooth',
        'auto': 'auto',
      },
    },
  },
  plugins: [],
}
