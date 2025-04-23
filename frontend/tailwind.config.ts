import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      width: {
        '1-12': '8.333333%',   // Para columna Código
        '2-12': '16.666667%',  // Para Monto, Total Grupo, Total Tipo
        '4-12': '33.333333%',  // Para columna Nombre
      },
    },
  },
  plugins: [],
} satisfies Config;
