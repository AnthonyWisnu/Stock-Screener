/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#10b981',  // emerald-500
        },
      },
      backgroundColor: {
        base: '#0f1117',
        card: '#13151f',
        surface: '#1a1d27',
      },
    },
  },
  plugins: [],
}
