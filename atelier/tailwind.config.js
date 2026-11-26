/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        editorial: ['Poppins', 'sans-serif'],
        serif: ['Poppins', 'sans-serif'],
      },
      fontWeight: {
        thin: 'var(--weight-regular)',
        extralight: 'var(--weight-regular)',
        light: 'var(--weight-regular)',
        normal: 'var(--weight-regular)',
        medium: 'var(--weight-medium)',
        semibold: 'var(--weight-semibold)',
        bold: 'var(--weight-semibold)',
        extrabold: 'var(--weight-semibold)',
        black: 'var(--weight-semibold)',
      },
      fontSize: {
        breadcrumb: ['var(--type-breadcrumb)', { lineHeight: '1.4' }],
        'page-title': ['var(--type-page-title)', { lineHeight: '1.15' }],
        subtitle: ['var(--type-subtitle)', { lineHeight: '1.5' }],
        'card-title': ['var(--type-card-title)', { lineHeight: '1.4' }],
        label: ['var(--type-label)', { lineHeight: '1.45' }],
        metric: ['var(--type-metric)', { lineHeight: '1.2' }],
        table: ['var(--type-table)', { lineHeight: '1.45' }],
        'table-header': ['var(--type-table-header)', { lineHeight: '1.4' }],
        control: ['var(--type-control)', { lineHeight: '1.4' }],
      },
      colors: {
        atelier: {
          brand: '#5C4033',
          'brand-dark': '#3D2920',
          'brand-2': '#9A7458',
          'brand-3': '#C2A48A',
          ink: '#1A1A1A',
          body: '#3F3B36',
          muted: '#6F6A62',
          faint: '#A39D93',
          line: '#ECE7DE',
          soft: '#F4EFE8',
          panel: '#FAF8F4',
          track: '#F1ECE4',
          canvas: '#F6F4EF',
          danger: '#B4382E',
          'danger-bg': '#FBECEA',
          warn: '#9A5B14',
          'warn-bg': '#FBF1E1',
          success: '#2F7A4F',
          'success-bg': '#E7F3EC',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      },
      aspectRatio: {
        '3/4': '3 / 4',
      }
    },
  },
  plugins: [],
}
