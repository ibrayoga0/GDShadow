/**** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f6ff', 100: '#e6edff', 200: '#cddaff', 300: '#a7bfff',
          400: '#7a9bff', 500: '#547bff', 600: '#2f58ff', 700: '#1f3ed6',
          800: '#192fa3', 900: '#172a80', 950: '#0b1540',
        }
      }
    },
  },
  plugins: [],
};
