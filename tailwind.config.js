/**
 * 🍑 PLUM TAILWIND CONFIGURATION
 * ============================================
 * Extended Tailwind config with brand colors as CSS variables.
 * 
 * This allows using classes like:
 * - text-brand-primary, bg-brand-primary, border-brand-primary
 * - text-brand-text, bg-brand-background, etc.
 * 
 * Colors are defined as CSS variables in index.css
 * Update index.css and brand.ts to change the color scheme.
 */

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx",
  ],
  theme: {
    extend: {
      // ========== FONTS ==========
      fontFamily: {
        sans: ['SF Pro Rounded', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      
      // ========== BRAND COLORS (CSS Variables) ==========
      colors: {
        brand: {
          // Primary colors (Yellow - for hero cards, accents)
          primary: 'var(--brand-primary)',
          'primary-light': 'var(--brand-primary-light)',
          'primary-lighter': 'var(--brand-primary-lighter)',
          'primary-dark': 'var(--brand-primary-dark)',
          
          // Button colors
          'button-primary': 'var(--brand-button-primary)',
          'button-primary-hover': 'var(--brand-button-primary-hover)',
          'button-secondary': 'var(--brand-button-secondary)',
          'button-secondary-hover': 'var(--brand-button-secondary-hover)',
          
          // Secondary colors (Tomato Red)
          secondary: 'var(--brand-secondary)',
          
          // Accent (Green)
          accent: 'var(--brand-accent)',
          
          // Backgrounds
          background: 'var(--brand-background)',
          surface: 'var(--brand-surface)',
          'surface-secondary': 'var(--brand-surface-secondary)',
          'surface-light': 'var(--brand-surface-light)',
          
          // Text on light surfaces
          'text-on-light': 'var(--brand-text-on-light)',
          
          // Text
          text: 'var(--brand-text)',
          'text-secondary': 'var(--brand-text-secondary)',
          'text-tertiary': 'var(--brand-text-tertiary)',
          
          // Semantic
          success: 'var(--brand-success)',
          warning: 'var(--brand-warning)',
          error: 'var(--brand-error)',
          info: 'var(--brand-info)',
          
          // UI
          divider: 'var(--brand-divider)',
        },
      },
      
      // ========== SHADOWS ==========
      boxShadow: {
        'brand': 'var(--shadow-primary)',
        'brand-secondary': 'var(--shadow-secondary)',
        'card': 'var(--shadow-card)',
        'elevated': 'var(--shadow-elevated)',
      },
      
      // ========== BORDER RADIUS (matching brand.ts UI values) ==========
      borderRadius: {
        'card': '22px',
        'button': '18px',
        'input': '12px',
        'modal': '28px',
      },
    },
  },
  plugins: [],
}
