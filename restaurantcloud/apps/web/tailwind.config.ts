import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // Tema único: las variantes dark: solo aplican con la clase .dark explícita,
  // nunca por la preferencia del sistema operativo (regla C5 de la guía de refactor UI).
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aurea: {
          navy: '#0B2340',       // Color principal: cabeceras, fondos destacados, textos sobre marfil
          copper: '#D5A06F',     // Acento cálido: bordes, iconos, detalles
          champagne: '#F4D7B0',  // Complemento cálido: superficies destacadas, botones secundarios
          ivory: '#FFF9F0',      // Fondo base cálido de páginas y tarjetas
        },
        // Neutros derivados del navy ÁUREA; sustituyen progresivamente a slate-* (regla C2)
        tinta: {
          50: '#F5F6F8',
          100: '#E7EAEF',
          200: '#C9D0DB',
          300: '#9AA6B8',
          400: '#6B7A91',
          500: '#4A5A72',
          600: '#334359',
          700: '#22324A',
          800: '#16273F',
          900: '#0B2340',
          950: '#06162B',
        },
        // Colores de estado semánticos: los únicos permitidos para estados (regla C3)
        estado: {
          ok: colors.emerald,
          alerta: colors.amber,
          error: colors.rose,
          info: {
            50: '#F5F6F8',
            100: '#E7EAEF',
            200: '#C9D0DB',
            500: '#4A5A72',
            600: '#334359',
            700: '#22324A',
            800: '#0B2340',
          },
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'Arial', 'system-ui', '-apple-system', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
        // sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px son nativos
      },
      minHeight: {
        // Objetivo táctil mínimo de 44px (regla RS5)
        tactil: '2.75rem',
      },
      minWidth: {
        tactil: '2.75rem',
      },
    },
  },
  plugins: [],
};

export default config;
