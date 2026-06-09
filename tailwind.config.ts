import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // SELA brand
        sela: {
          yellow: "#F5E76B",
          "yellow-bright": "#FFE769",
          "yellow-dark": "#D4C656",
          mint: "#6EE6B9",
          "mint-dark": "#4FBF94",
          red: "#E31B23", // logo accent only
        },

        // Surfaces (dark theme)
        canvas: "#0A0A0B", // page background
        surface: {
          DEFAULT: "#131316", // card background
          1: "#16161A", // slight elevation
          2: "#1A1A1F", // hover / elevated
          3: "#1F1F25", // raised
        },
        line: {
          DEFAULT: "#22222A", // subtle border
          strong: "#2C2C36", // stronger
        },

        // Ink scale (text)
        ink: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          // WCAG AA on bg-surface
          500: "#87878A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(0,0,0,0.32), 0 1px 3px 0 rgba(0,0,0,0.24)",
        card: "0 1px 3px 0 rgba(0,0,0,0.36), 0 4px 16px -4px rgba(0,0,0,0.32)",
        elevated:
          "0 10px 24px -8px rgba(0,0,0,0.6), 0 4px 6px -1px rgba(0,0,0,0.4)",
        glow: "0 0 0 4px rgba(245, 231, 107, 0.18)",
        "glow-mint": "0 0 0 4px rgba(110, 230, 185, 0.18)",
        "yellow-glow":
          "0 0 32px -8px rgba(245, 231, 107, 0.45), 0 0 80px -16px rgba(245, 231, 107, 0.25)",
      },
      backgroundImage: {
        "yellow-radial":
          "radial-gradient(ellipse at top, rgba(245,231,107,0.10), transparent 70%)",
        "mint-radial":
          "radial-gradient(ellipse at top, rgba(110,230,185,0.10), transparent 70%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 240ms ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
