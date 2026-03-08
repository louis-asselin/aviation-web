import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EBF5FF',
          100: '#D6EBFF',
          200: '#ADD6FF',
          300: '#85C2FF',
          400: '#5CADFF',
          500: '#1B3A5C',
          600: '#163050',
          700: '#112544',
          800: '#0C1B38',
          900: '#07102C',
        },
        accent: {
          50: '#E8F6FC',
          100: '#D1EDF9',
          200: '#A3DBF3',
          300: '#75C9ED',
          400: '#47B7E7',
          500: '#2E86AB',
          600: '#256B89',
          700: '#1C5067',
          800: '#133644',
          900: '#0A1B22',
        },
      },
    },
  },
  plugins: [],
};
export default config;
