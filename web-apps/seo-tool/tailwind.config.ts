import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        dark: "#0F172A",
        accent: "#22D3EE"
      }
    }
  },
  plugins: []
};
export default config;
