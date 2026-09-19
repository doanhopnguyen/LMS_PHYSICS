export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#93000b',
        'primary-container': '#b91c1c',
        'on-primary': '#ffffff',
        'on-surface': '#121c2a',
        'on-surface-variant': '#5b403d',
        background: '#f8f9ff',
        surface: '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e6eeff',
        'surface-container-high': '#dee9fc',
        'surface-container-highest': '#d9e3f6',
        'surface-variant': '#d9e3f6',
        'outline-variant': '#e4beb9',
        outline: '#8f6f6c',
        'primary-fixed': '#ffdad6',
        'primary-fixed-dim': '#ffb4ab',
        'on-primary-fixed': '#410002',
        'error-container': '#ffdad6',
        error: '#ba1a1a',
        'secondary-container': '#fccc38',
        secondary: '#755b00',
        'tertiary-container': '#006d30',
        tertiary: '#005223'
      },
      borderRadius: {
        DEFAULT: 'var(--ptit-radius-compact)',
        lg: 'var(--ptit-radius-panel)',
        xl: 'var(--ptit-radius-panel)',
        '2xl': 'var(--ptit-radius-panel)',
        full: 'var(--ptit-radius-pill)'
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        gutter: '1.5rem',
        margin: '1.5rem'
      },
      fontFamily: {
        'body-md': ['Be Vietnam Pro', 'sans-serif'],
        'body-md-medium': ['Be Vietnam Pro', 'sans-serif'],
        'body-sm': ['Be Vietnam Pro', 'sans-serif'],
        'body-lg': ['Be Vietnam Pro', 'sans-serif'],
        'headline-sm': ['Be Vietnam Pro', 'sans-serif'],
        'headline-md': ['Be Vietnam Pro', 'sans-serif'],
        'headline-lg': ['Be Vietnam Pro', 'sans-serif'],
        'display-lg-mobile': ['Be Vietnam Pro', 'sans-serif'],
        'label-sm': ['Be Vietnam Pro', 'sans-serif'],
        'label-md': ['Be Vietnam Pro', 'sans-serif']
      },
      fontSize: {
        'body-md-medium': ['14px', { lineHeight: '24px', fontWeight: '500' }],
        'body-md': ['14px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '20px', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '26px', fontWeight: '400' }],
        'headline-sm': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'headline-lg': ['30px', { lineHeight: '38px', fontWeight: '700' }],
        'display-lg-mobile': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'label-md': ['13px', { lineHeight: '18px', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '600' }]
      },
      boxShadow: {
        xs: '0 1px 3px rgba(15, 23, 42, 0.04)'
      }
    }
  },
  plugins: []
};
