/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx,vue}', './public/index.html'],
  theme: {
    extend: {
      color: {
        'ts-bg': '#F8F9FB',
        'ts-red': '#FF4F4F',
        'ts-orange': '#F98A3B',
        'ts-yellow': '#EBB402',
        'ts-green': '#35AF88',

        'ts-gray-1': '#F5F5F8',
        'ts-gray-2': '#E9EBF0',
        'ts-gray-3': '#D7DDE6',
        'ts-gray-4': '#D0D1DA',
        'ts-gray-5': '#BBBBC3',
        'ts-gray-6': '#8B909C',
        'ts-gray-7': '#5C5E68',
        'ts-gray-8': '#34353A',
        'ts-gray-9': '#25262B',

        'ts-blue-1': '#1640DB',
        'ts-blue-2': '#627EEA',
        'ts-blue-3': '#202741'
      },}
  },
  // 플러그인을 추가할 경우 이곳에 나열
  plugins: []
}
