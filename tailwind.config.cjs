/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        pitch: '#050505',
        stark: '#ffffff',
        crimson: { DEFAULT: '#660000', dark: '#4a0000', light: '#8b0000' },
        cyan: { DEFAULT: '#00e5ff', dark: '#00b3cc' },
        olive: '#2e4a22',
        gray: { 900: '#111111', 800: '#222222', 400: '#888888' },
      },
      fontFamily: {
        display: ['"Pirata One"', 'cursive'],
        heading: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'brutal-cyan': '4px 4px 0px 0px #00e5ff',
        'brutal-crimson': '4px 4px 0px 0px #660000',
        'brutal-white': '4px 4px 0px 0px #ffffff',
      },
    },
  },
};
