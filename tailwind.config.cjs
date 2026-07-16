/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Amiri', 'Georgia', 'serif'],
      },
      colors: {
        deep: '#0a1628',
        navy: '#0d2240',
        gold: '#c9a84c',
        'gold-light': '#f0d080',
        teal: '#0e7490',
        'teal-light': '#22d3ee',
        'off-white': '#f8fafc',
      },
    },
  },
  plugins: [],
};
