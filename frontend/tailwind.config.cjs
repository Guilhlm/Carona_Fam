/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        brand: '#5F5FAA', // cor principal da marca (links, botões de ação)
        'surface-input': '#242424', // fundo dos inputs/cartões escuros
        'surface-form': '#5C5C5C', // fundo específico dos inputs do formulário de perfil
        'border-muted': '#333232', // bordas e ícones mais escuros
        'text-main': '#D4D4D4', // texto principal em fundo escuro
        'text-muted': '#333232', // texto/ícones em contraste mais baixo
      },
    },
  },
  plugins: [],
};
