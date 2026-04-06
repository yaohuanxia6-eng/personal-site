import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B7355',
          light:   '#A89070',
          dark:    '#6B5640',
        },
        accent: {
          DEFAULT: '#7BAE84',
          light:   '#A3C9A8',
          dark:    '#5A9468',
        },
        background: '#FBF7F0',
        surface:    '#FFFFFF',
        'surface-2': '#F5EFE6',
        'text-primary':   '#3D2F1F',
        'text-secondary': '#7A6350',
        'text-muted':     '#B8A898',
        border:        'rgba(139,115,85,0.15)',
        'border-dark': 'rgba(139,115,85,0.25)',
        crisis: '#C0392B',
        'crisis-bg': '#FEF2F2',
      },
      fontFamily: {
        serif: ['"Lora"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans:  ['"Noto Sans SC"', '"PingFang SC"', 'sans-serif'],
      },
      fontSize: {
        'title-lg': ['22px', { lineHeight: '1.4', fontWeight: '600' }],
        'title-md': ['18px', { lineHeight: '1.5', fontWeight: '600' }],
        'title-sm': ['15px', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg':  ['15px', { lineHeight: '1.8' }],
        'body-md':  ['14px', { lineHeight: '1.8' }],
        'body-sm':  ['13px', { lineHeight: '1.7' }],
        'label':    ['11px', { lineHeight: '1.4', letterSpacing: '0.06em' }],
      },
      borderRadius: {
        'card':   '12px',
        'bubble': '20px',
        'input':  '10px',
        'btn':    '8px',
        'chip':   '99px',
      },
      boxShadow: {
        'card':       '0 1px 6px rgba(139,115,85,0.08), 0 4px 16px rgba(139,115,85,0.04)',
        'card-hover': '0 4px 16px rgba(139,115,85,0.14)',
        'btn':        '0 2px 8px rgba(139,115,85,0.2)',
        'input':      '0 1px 4px rgba(139,115,85,0.05)',
      },
      spacing: {
        'page-x': '20px',
        'page-y': '24px',
        'section': '24px',
        'item':    '12px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
