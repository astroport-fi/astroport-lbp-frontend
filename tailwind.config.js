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
          lighter: '#636379',
          light: '#373743',
          bluer: '#353543',
          DEFAULT: '#2e2e38',
          dark: '#1c1c23'
        }
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
