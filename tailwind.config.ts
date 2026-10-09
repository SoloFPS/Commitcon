import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: {
    forest: "#1f4d36", sage: "#dfe8df", ink: "#222826", cream: "#faf8f3", amber: { warn: "#b7791f" }
  } } },
  plugins: [],
} satisfies Config;
