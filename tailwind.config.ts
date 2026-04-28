import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#06121f',
        skyline: '#0c1f35',
      },
      boxShadow: {
        glow: '0 0 30px rgba(96, 165, 250, 0.22)',
      },
    },
  },
  plugins: [],
};

export default config;
