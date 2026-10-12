import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        aurea: {
          navy: '#0B2340',       // Color principal: cabeceras, fondos destacados, textos sobre marfil
          copper: '#D5A06F',     // Acento cálido: bordes, iconos, detalles
          champagne: '#F4D7B0',  // Complemento cálido: superficies destacadas, botones secundarios
          ivory: '#FFF9F0',      // Fondo base cálido de páginas y tarjetas
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
        // sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px son nativos
      },
    },
  },
  plugins: [],
};

export default config;
