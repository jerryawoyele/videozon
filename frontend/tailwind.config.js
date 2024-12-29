/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // Blue-600
          dark: '#1d4ed8',    // Blue-700
          light: '#3b82f6',   // Blue-500
          lighter: '#60a5fa', // Blue-400
        },
        secondary: {
          DEFAULT: '#1e40af', // Blue-800
          dark: '#1e3a8a',    // Blue-900
          light: '#2563eb',   // Blue-600
        }
      }
    },
  },
  plugins: [],
}; 