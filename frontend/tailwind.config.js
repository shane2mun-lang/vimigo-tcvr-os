/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        // Health bands for red / yellow / green diagnostics
        health: { green: '#16a34a', yellow: '#eab308', red: '#dc2626' },
        // One signature color per TCVR pillar (used across rings, badges, charts)
        tcvr: {
          traffic: '#3b82f6',
          conversion: '#8b5cf6',
          value: '#f59e0b',
          recurring: '#10b981',
        },
        brand: { DEFAULT: '#0f172a', accent: '#6366f1', soft: '#eef2ff' },
      },
      keyframes: {
        countup: { '0%': { opacity: '0.35' }, '100%': { opacity: '1' } },
        popdelta: { '0%': { transform: 'scale(0.96)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        countup: 'countup 240ms ease-out',
        popdelta: 'popdelta 200ms ease-out',
      },
    },
  },
  plugins: [],
}
