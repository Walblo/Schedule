import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg:          '#191B1C',
          surface:     '#1E2021',
          card:        '#242627',
          border:      '#383B3D',
          muted:       '#595F61',
          text:        '#EDEFF0',
          'text-dim':  '#9BA3A8',
          green:       '#3BC45F',
          'green-mid': '#2D9D4B',
          'green-deep':'#1F7436',
          'green-dark':'#114B20',
          'green-tint':'#172B1E',
          orange:      '#C45F3B',
          'orange-dk': '#914529',
        },
      },
      fontFamily: {
        cinzel: ['var(--font-cinzel)', 'serif'],
        inter:  ['var(--font-inter)',  'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(59, 196, 95, 0.15)',
      },
    },
  },
  plugins: [],
}

export default config
