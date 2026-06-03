/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vitalis: {
          primary: '#1A5F7A',      // Azul Profundo
          secondary: '#7F9C7A',    // Verde Salvia
          accent: '#E88D4D',       // Naranja Cálido
          light: '#F4F6F8',        // Gris Claro
          dark: '#1E293B',         // Grafito Pizarra
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
