/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // WayPoint Design System — "The Cinematic Navigator"
        wp: {
          // Surface hierarchy (background tiers)
          'surface':               '#0b1326',
          'surface-dim':           '#0b1326',
          'surface-lowest':        '#060e20',
          'surface-container-low': '#131b2e',
          'surface-container':     '#171f33',
          'surface-container-high':'#222a3d',
          'surface-container-highest': '#2d3449',
          'surface-bright':        '#31394d',
          'surface-variant':       '#2d3449',

          // Primary
          'primary':               '#b7c4ff',
          'primary-container':     '#0052ff',
          'primary-fixed':         '#dde1ff',
          'primary-fixed-dim':     '#b7c4ff',
          'on-primary':            '#002682',
          'on-primary-container':  '#dfe3ff',

          // Secondary
          'secondary':             '#b7c8e1',
          'secondary-container':   '#3a4a5f',
          'on-secondary':          '#213145',
          'on-secondary-container':'#a9bad3',

          // Tertiary
          'tertiary':              '#7bd0ff',
          'tertiary-container':    '#006e95',
          'on-tertiary':           '#00354a',

          // Text / On-surface
          'on-surface':            '#dae2fd',
          'on-surface-variant':    '#c3c5d9',
          'on-background':         '#dae2fd',
          'inverse-surface':       '#dae2fd',
          'inverse-on-surface':    '#283044',
          'inverse-primary':       '#004ced',

          // Outline
          'outline':               '#8d90a2',
          'outline-variant':       '#434656',

          // Error
          'error':                 '#ffb4ab',
          'error-container':       '#93000a',
          'on-error':              '#690005',

          // Surface tint
          'surface-tint':          '#b7c4ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'wp': '8px',
        'wp-lg': '12px',
        'wp-xl': '16px',
      },
      boxShadow: {
        'wp-ambient': '0px 20px 40px rgba(6, 14, 32, 0.4)',
        'wp-glow': '0 0 4px rgba(183, 196, 255, 0.2)',
        'wp-card': '0 4px 16px rgba(6, 14, 32, 0.3)',
      },
      backgroundImage: {
        'wp-gradient': 'linear-gradient(135deg, #b7c4ff, #0052ff)',
        'wp-gradient-hover': 'linear-gradient(135deg, #dde1ff, #3377ff)',
        'wp-hero-overlay': 'linear-gradient(to top, #0b1326 0%, transparent 60%)',
      },
      backdropBlur: {
        'wp': '16px',
        'wp-heavy': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
