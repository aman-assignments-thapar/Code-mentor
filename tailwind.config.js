/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lc: {
          bg: '#1a1a1a',
          panel: '#282828',
          layer: '#303030',
          border: '#3e3e3e',
          text: '#eff1f6',
          muted: '#9ca3af',
          orange: '#ffa116',
          easy: '#00b8a3',
          medium: '#ffc01e',
          hard: '#ff375f',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
