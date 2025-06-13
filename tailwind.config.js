/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        underla: {
          DEFAULT: '#FF6B00',
          50: '#FFF2E5',
          100: '#FFE5CC',
          200: '#FFCC99',
          300: '#FFB266',
          400: '#FF9933',
          500: '#FF6B00', // Main brand color
          600: '#CC5500',
          700: '#994000',
          800: '#662A00',
          900: '#331500'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
} 