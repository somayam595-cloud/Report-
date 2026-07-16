/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'Arial', 'sans-serif'],
        serif: ['Amiri', 'Georgia', 'serif'],
      },
      colors: {
        ink: '#0b1f35',
        navy: '#102a43',
        teal: '#178f9f',
        'teal-dark': '#0d6f7b',
        gold: '#c7a246',
        paper: '#f7f9fc',
      },
      boxShadow: {
        soft: '0 14px 40px rgba(15, 42, 67, 0.10)',
      },
    },
  },
  plugins: [],
};
