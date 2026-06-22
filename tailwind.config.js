/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        green: {
          primary: '#16a34a',
          light: '#4ade80',
          pale: '#f0fdf4',
        },
      },
    },
  },
  plugins: [],
};
