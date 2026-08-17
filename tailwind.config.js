/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#faf8ff',
          dim: '#d2d9f4',
          bright: '#faf8ff',
          'container-lowest': '#ffffff',
          'container-low': '#f2f3ff',
          container: '#eaedff',
          'container-high': '#e2e7ff',
          'container-highest': '#dae2fd',
          variant: '#dae2fd',
          white: '#FFFFFF',
        },
        'on-surface': {
          DEFAULT: '#131b2e',
          variant: '#434655',
        },
        'inverse-surface': '#283044',
        'inverse-on-surface': '#eef0ff',
        outline: {
          DEFAULT: '#737686',
          variant: '#c3c6d7',
        },
        'surface-tint': '#0053db',
        primary: {
          DEFAULT: '#004ac6',
          container: '#2563eb',
          fixed: '#dbe1ff',
          'fixed-dim': '#b4c5ff',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#eeefff',
          fixed: '#00174b',
          'fixed-variant': '#003ea8',
        },
        'inverse-primary': '#b4c5ff',
        secondary: {
          DEFAULT: '#006a61',
          container: '#86f2e4',
          fixed: '#89f5e7',
          'fixed-dim': '#6bd8cb',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#006f66',
          fixed: '#00201d',
          'fixed-variant': '#005049',
        },
        tertiary: {
          DEFAULT: '#943700',
          container: '#bc4800',
          fixed: '#ffdbcd',
          'fixed-dim': '#ffb596',
        },
        'on-tertiary': {
          DEFAULT: '#ffffff',
          container: '#ffede6',
          fixed: '#360f00',
          'fixed-variant': '#7d2d00',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a',
        },
        background: '#faf8ff',
        'on-background': '#131b2e',
        'glass-stroke': 'rgba(255, 255, 255, 0.4)',
        'electric-glow': 'rgba(37, 99, 235, 0.15)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg-mobile': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-mono': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
        'chat-text': ['15px', { lineHeight: '22px', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        'electric-glow': '0 0 20px rgba(37, 99, 235, 0.2)',
        'glass-card': '0 4px 20px -2px rgba(19, 27, 46, 0.05), 0 0 1px 1px rgba(255, 255, 255, 0.6) inset',
        'glass-card-hover': '0 12px 30px -4px rgba(19, 27, 46, 0.08), 0 0 1px 1px rgba(37, 99, 235, 0.3) inset',
      },
      backdropBlur: {
        xs: '2px',
        glass: '12px',
      },
      maxWidth: {
        'container-max': '1200px',
        'chat-lane': '720px',
      },
      spacing: {
        unit: '4px',
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '64px',
      },
    },
  },
  plugins: [],
};
