/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0F5F2',
          100: '#E6EFE8',
          500: '#8FB39C',
          800: '#2F4A3A',
          900: '#1A2B22',
        },
        sage: {
          50: '#F4F7F5',
          100: '#E6EFE8',
          200: '#CBE0D2',
          500: '#8FB39C',
          700: '#4A6B56',
        },
        health: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'soft': '0 2px 10px -2px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
      }
    },
  },
  plugins: [],
}
