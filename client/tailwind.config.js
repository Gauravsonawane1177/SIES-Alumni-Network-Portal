/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#F8EDED',
          100: '#EFD6D8',
          500: '#8B2E36',
          700: '#6B1C23',
          800: '#54151B',
          900: '#3B0E13'
        },
        gold: {
          400: '#D4B45A',
          500: '#C9A227',
          600: '#A8861B'
        },
        ivory: '#F7F3EE'
      },
      fontFamily: {
        sans: ['Source Sans 3', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif']
      },
      boxShadow: {
        card: '0 10px 30px rgba(84, 21, 27, 0.08)'
      }
    }
  },
  plugins: []
};
