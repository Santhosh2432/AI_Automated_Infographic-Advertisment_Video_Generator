/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F172A', // Slate 900 (Formal)
          dark: '#020617',    // Slate 950
          light: '#334155',   // Slate 700
          accent: '#2563EB'   // Blue 600
        },
        surface: {
          1: '#FFFFFF',       // Pure White
          2: '#F8FAFC',       // Slate 50
          3: '#F1F5F9',       // Slate 100
          4: '#E2E8F0',       // Slate 200
          5: '#94A3B8'        // Slate 400
        },
        accent: {
          cyan: '#0EA5E9',    // Sky 500
          purple: '#8B5CF6',  // Violet 500
          emerald: '#10B981', // Emerald 500
          amber: '#F59E0B'    // Amber 500
        }
      },
      animation: {
        'glow-pulse': 'glowPulse 4s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%': { opacity: '0.4' },
          '100%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
