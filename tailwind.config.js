/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ألوان وزارة الصحة السعودية
        moh: {
          primary: '#006C35',     // الأخضر السعودي الأساسي
          'primary-dark': '#004D26',
          'primary-light': '#0A8C44',
          secondary: '#C5A572',   // ذهبي
          accent: '#1B4332',
          gold: '#D4A24C',
          'bg-light': '#F5F7F6',
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 108, 53, 0.08)',
        'soft-lg': '0 4px 20px rgba(0, 108, 53, 0.12)',
      },
    },
  },
  plugins: [],
};
