/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#102A43',     // Deep Navy
          primaryLight: '#243B53',
          primaryDark: '#0A1A2A',
          secondary: '#1677FF',   // Electric Blue
          secondaryHover: '#0E62D9',
          bg: '#F7F9FC',          // Light Grey Background
          surface: '#FFFFFF',     // Clean White Surface
          card: '#FFFFFF',
          success: '#16A36A',     // Green
          danger: '#E5484D',      // Warning / Critical Red
          warning: '#F4A340',     // Orange / Review
          border: '#E2E8F0',
          muted: '#627D98',
          subtle: '#829AB1',
        }
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Hiragino Sans',
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          'Meiryo',
          'sans-serif'
        ],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'ev-sm': '0 1px 3px rgba(16, 42, 67, 0.05)',
        'ev-md': '0 4px 12px rgba(16, 42, 67, 0.07)',
        'ev-lg': '0 10px 25px -5px rgba(16, 42, 67, 0.1), 0 8px 10px -6px rgba(16, 42, 67, 0.04)',
        'ev-glow': '0 0 15px rgba(22, 119, 255, 0.35)',
        'ev-danger-glow': '0 0 15px rgba(229, 72, 77, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
