const colors = require('tailwindcss/colors')

module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        gray: colors.trueGray,
        yellow: {
          DEFAULT: '#ffd04e'
        },
        'blue-gray': {
          300: '#636379',
          400: '#464658',
          500: '#373743',
          600: '#353543',
          700: '#2e2e38',
          900: '#1c1c23'
        }
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
