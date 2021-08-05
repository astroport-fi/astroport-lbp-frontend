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
        primary: {
          DEFAULT: '#5643F2'
        },
        positive: {
          DEFAULT: '#83FFCB'
        },
        negative: {
          DEFAULT: '#FF8383'
        }
      }
    },
  },
  variants: {
    extend: {
      animation: ['hover']
    },
  },
  plugins: [],
}
