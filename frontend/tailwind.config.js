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
          900: '#7b3a17',
          yellow: {
            highlight: '#fff8e1',
            text: '#d68a2d',
          },
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
      fontFamily: {
        mali: ['Mali', 'cursive'],
        nunito: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
