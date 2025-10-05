/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D9BF0',
          hover: '#1A8CD8',
        },
        dark: {
          bg: '#000000',
          card: '#16181C',
          hover: '#1D1F23',
          border: '#2F3336',
          text: {
            primary: '#E7E9EA',
            secondary: '#71767B',
          }
        },
        accent: {
          blue: '#1D9BF0',
          green: '#00BA7C',
          red: '#F4212E',
          yellow: '#FAA626',
        },
        gray: {
          750: '#2D3748',
          850: '#1A202C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
}