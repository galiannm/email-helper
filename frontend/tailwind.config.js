/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        acacia: {
          50: '#fef7ed',
          100: '#fdecd6',
          200: '#fad5ac',
          300: '#f7b878',
          400: '#faa338',
          500: '#f58b1f',
          600: '#e67115',
          700: '#bf5614',
          800: '#984418',
          900: '#7b3a17',

          blue: {
            highlight: '#e1eff6',
            text: '#5ba2c4',
          },
          orange: {
            highlight: '#fbeedc',
            text: '#d68a2d',
            dark: '#b76f24',
          },
          red: {
            highlight: '#f9e5e3',
            text: '#cf756a',
          },
          green: {
            highlight: '#f6f8e3',
            text: '#6a994e',
          },
          purple: {
            highlight: '#f2e9f1',
            text: '#ae7eab',
          },
        },
      },
      screens: {
        'xm': '880px',
      },
      fontFamily: {
        mali: ['Mali', 'cursive'],
        nunito: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
