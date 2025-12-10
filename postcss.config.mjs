/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // เปลี่ยนจาก 'tailwindcss' เป็นตัวนี้ครับ
    autoprefixer: {},
  },
};

export default config;