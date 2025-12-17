/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f172a',
        'dark-surface': '#1e293b',
        'dark-hover': '#334155',
        'primary': '#3b82f6',
        'primary-hover': '#2563eb',
      }
    },
  },
  plugins: [],
}
