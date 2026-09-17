/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kandooreh: {
          gold: '#D4AF37',        // طلایی زری و گلابتون
          goldDark: '#B38F24',
          goldLight: '#F3E5AB',
          sand: '#F8F5EE',        // رنگ شنی پس‌زمینه
          sandDark: '#EADFC7',
          terracotta: '#C85A32',  // سفالی گرم جنوب
          turquoise: '#0E8388',   // فیروزه‌ای خلیج فارس
          dark: '#23201C',        // مشکی ذغالی متون
          muted: '#7E7667',
        }
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(212, 175, 55, 0.08)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}